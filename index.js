const querystring = require("querystring")
const iso8601 = require("./lib/iso8601-regex")
const { Op } = require("sequelize")

// Convert comma separated list to a sequelize projection (attributes array).
// for example f('field1,field2,field3') -> ['field1','field2','field3']
function fieldsToSequelize(fields) {
  if (!fields) return null
  return fields.split(",")
}

// Convert comma separated list to a sequelize projection (attributes object).
// for example f('field1,field2,field3') -> { exclude: ['field1','field2','field3']}
function omitFieldsToSequelize(omitFields) {
  if (!omitFields) return null
  return { exclude: omitFields.split(",") }
}

// Convert comma separated list to sequelize sort options (sort array).
// for example f('field1,+field2,-field3') -> [['field1', 'ASC'], ['field2', 'ASC'], ['field3', 'DESC']]
function sortToSequelize(sort) {
  const sortArray = []
  if (!sort) return sortArray
  sort.split(",").forEach(function (field) {
    const c = field.charAt(0) === "-"
    sortArray.push([c ? field.substring(1) : field, c ? "DESC" : "ASC"])
  })
  return sortArray
}

// Convert String to Number, Date, or Boolean if possible. Also strips ! prefix
function typedValue(value) {
  if (value[0] === "!") value = value.substr(1)
  const regex = value.match(/^\/(.*)\/(i?)$/)
  const quotedString = value.match(/(["'])(?:\\\1|.)*?\1/)

  if (regex) {
    return new RegExp(regex[1], regex[2])
  } else if (quotedString) {
    return quotedString[0].substr(1, quotedString[0].length - 2)
  } else if (value === "true") {
    return true
  } else if (value === "false") {
    return false
  } else if (iso8601.test(value) && value.length !== 4) {
    return new Date(value)
  } else if (isFinite(Number(value))) {
    return Number(value)
  }

  return value
}

// Convert a comma separated string value to an array of values. Commas
// in a quoted strings and regexes are ignored.  Also strips ! prefix from values.
function typedValues(svalue) {
  const commaSplit = /("[^"]*")|('[^']*')|(\/[^\/]*\/i?)|([^,]+)/g
  return svalue.match(commaSplit).map(value => typedValue(value))
}

// Convert a key/value pair split at an equals sign into a sequelize comparison.
// Converts value Strings to Numbers or Booleans when possible.
// for example:
// + f('key','value') => {key:'key',value:'value'}
// + f('key>','value') => {key:'key',value:{[Op.gt]:'value'}}
// + f('key') => {key:'key',value:{[Op.is]: true}}
// + f('!key') => {key:'key',value:{[Op.is]: false}}
// + f('key:op','value') => {key: 'key', value:{ [Op.op]: value}}
function comparisonToSequelize(key, value) {
  const join = value === "" ? key : key.concat("=", value)
  const parts = join.match(/^(!?[^><!=:]+)(?:=?([><]=?|!?=|:.+=)(.+))?$/)
  const hash = {}
  let op
  if (!parts) return null

  key = parts[1]
  op = parts[2]

  if (!op) {
    if (key[0] !== "!") value = { [Op.is]: true }
    else {
      key = key.substr(1)
      value = { [Op.is]: false }
    }
  } else if (op === "=" && parts[3] === "!") {
    value = { [Op.is]: false }
  } else if (op === "=" || op === "!=") {
    if (op === "=" && parts[3][0] === "!") op = "!="
    const array = typedValues(parts[3])
    if (array.length > 1) {
      value = {}
      op = op == "=" ? Op.in : Op.notIn
      value = { [op]: array }
    } else if (op === "!=") {
      value = array[0] instanceof RegExp ? { [Op.not]: array[0] } : { [Op.ne]: array[0] }
    } else if (array[0][0] === "!") {
      const sValue = array[0].substr(1)
      const regex = sValue.match(/^\/(.*)\/(i?)$/)
      value = regex ? { [Op.not]: new RegExp(regex[1], regex[2]) } : { [Op.ne]: sValue }
    } else {
      value = array[0]
    }
  } else if (op[0] === ":" && op[op.length - 1] === "=") {
    op = Symbol(op.substr(1, op.length - 2))
    const array = []
    parts[3].split(",").forEach(function (value) {
      array.push(typedValue(value))
    })
    value = {}
    value[op] = array.length === 1 ? array[0] : array
  } else {
    value = typedValue(parts[3])
    if (op === ">") value = { [Op.gt]: value }
    else if (op === ">=") value = { [Op.gte]: value }
    else if (op === "<") value = { [Op.lt]: value }
    else if (op === "<=") value = { [Op.lte]: value }
  }

  hash.key = key
  hash.value = value
  return hash
}

// Checks for keys that are ordinal positions, such as {'0':'one','1':'two','2':'three'}
function hasOrdinalKeys(obj) {
  const c = 0
  for (const key in obj) {
    if (Number(key) !== c++) return false
  }
  return true
}

// Convert query parameters to sequelize query criteria.
// for example {field1:"red","field2>2":""} becomes { field1: 'red', field2: { [Op.gt]: 2 }
function queryCriteriaToSequelize(query, options) {
  const hash = {}
  let p, deep
  options = options || {}

  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key) && (!options.ignore || options.ignore.indexOf(key) == -1)) {
      deep = typeof query[key] === "object" && !hasOrdinalKeys(query[key])

      if (deep) {
        p = {
          key,
          value: queryCriteriaToSequelize(query[key]),
        }
      } else {
        p = comparisonToSequelize(key, query[key])
      }

      if (p) {
        if (!hash[p.key]) {
          hash[p.key] = p.value
        } else {
          hash[p.key] = Object.assign(hash[p.key], p.value)
        }
      }
    }
  }
  return hash
}

// Convert query parameters to sequelize query options.
// for example {fields:'a,b',offset:8,limit:16, sort:"c,-d",} becomes {fields:['a','b'],sort":[["c","ASC"],["d","DESC"]],skip:8,limit:16}
function queryOtionsToSequelize(query, options) {
  const hash = {},
    fields = fieldsToSequelize(query[options.keywords.fields]),
    omitFields = omitFieldsToSequelize(query[options.keywords.omit]),
    sort = sortToSequelize(query[options.keywords.sort]),
    maxLimit = options.maxLimit || 9007199254740992
  let limit = options.maxLimit || 0

  if (fields) hash.fields = fields
  // omit intentionally overwrites fields if both have been specified in the query
  if (omitFields) hash.fields = omitFields
  if (sort) hash.sort = sort

  if (query[options.keywords.offset]) hash.skip = Number(query[options.keywords.offset])
  if (query[options.keywords.limit]) limit = Math.min(Number(query[options.keywords.limit]), maxLimit)
  if (limit) {
    hash.limit = limit
  } else if (options.maxLimit) {
    hash.limit = maxLimit
  }

  return hash
}

module.exports = function (query, options) {
  query = query || {}
  options = options || {}
  options.keywords = options.keywords || {}

  defaultKeywords = { fields: "fields", omit: "omit", sort: "sort", offset: "offset", limit: "limit" }
  options.keywords = Object.assign(defaultKeywords, options.keywords)
  ignoreKeywords = [options.keywords.fields, options.keywords.omit, options.keywords.sort, options.keywords.offset, options.keywords.limit]

  if (!options.ignore) {
    options.ignore = []
  } else {
    options.ignore = typeof options.ignore === "string" ? [options.ignore] : options.ignore
  }
  options.ignore = options.ignore.concat(ignoreKeywords)
  if (!options.parser) options.parser = querystring

  if (typeof query === "string") query = options.parser.parse(query)

  return {
    criteria: queryCriteriaToSequelize(query, options),
    options: queryOtionsToSequelize(query, options),

    links: function (url, totalCount) {
      const offset = this.options.skip || 0
      const limit = Math.min(this.options.limit || 0, totalCount)
      const links = {}
      const last = {}

      if (!limit) return null

      options = options || {}

      if (offset > 0) {
        query[options.keywords.offset] = Math.max(offset - limit, 0)
        links["prev"] = url + "?" + options.parser.stringify(query)
        query[options.keywords.offset] = 0
        links["first"] = url + "?" + options.parser.stringify(query)
      }
      if (offset + limit < totalCount) {
        last.pages = Math.ceil(totalCount / limit)
        last.offset = (last.pages - 1) * limit

        query[options.keywords.offset] = Math.min(offset + limit, last.offset)
        links["next"] = url + "?" + options.parser.stringify(query)
        query[options.keywords.offset] = last.offset
        links["last"] = url + "?" + options.parser.stringify(query)
      }
      return links
      // TODO: add number of pages
    },
  }
}
