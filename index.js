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
  if (value[0] == "!") value = value.substr(1)
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

// Convert a comma separated string value to an array of values.  Commas
// in a quoted strings and regexes are ignored.  Also strips ! prefix from values.
function typedValues(svalue) {
  const commaSplit = /("[^"]*")|('[^']*')|(\/[^\/]*\/i?)|([^,]+)/g
  return svalue.match(commaSplit).map(value => typedValue(value))
}

// Convert a key/value pair split at an equals sign into a sequelize comparison.
// Converts value Strings to Numbers or Booleans when possible.
// for example:
// + f('key','value') => {key:'key',value:'value'}
// + f('key>','value') => {key:'key',value:{$gte:'value'}}
// + f('key') => {key:'key',value:{$exists: true}}
// + f('!key') => {key:'key',value:{$exists: false}}
// + f('key:op','value') => {key: 'key', value:{ $op: value}}
// + f('key','op:value') => {key: 'key', value:{ $op: value}}
function comparisonToSequelize(key, value) {
  const join = value == "" ? key : key.concat("=", value)
  const parts = join.match(/^(!?[^><!=:]+)(?:=?([><]=?|!?=|:.+=)(.+))?$/)
  const hash = {}
  let op
  if (!parts) return null

  key = parts[1]
  op = parts[2]

  if (!op) {
    if (key[0] != "!") value = { [$exists]: true }
    else {
      key = key.substr(1)
      value = { $exists: false }
    }
  } else if (op == "=" && parts[3] == "!") {
    value = { $exists: false }
  } else if (op == "=" || op == "!=") {
    if (op == "=" && parts[3][0] == "!") op = "!="
    const array = typedValues(parts[3])
    if (array.length > 1) {
      value = {}
      op = op == "=" ? [Op.in] : [Op.notIn]
      value[op] = array
    } else if (op == "!=") {
      value = array[0] instanceof RegExp ? { [Op.not]: array[0] } : { [Op.ne]: array[0] }
    } else if (array[0][0] == "!") {
      const sValue = array[0].substr(1)
      const regex = sValue.match(/^\/(.*)\/(i?)$/)
      value = regex ? { [Op.not]: new RegExp(regex[1], regex[2]) } : { [Op.ne]: sValue }
    } else {
      value = array[0]
    }
  } else if (op[0] == ":" && op[op.length - 1] == "=") {
    op = "$" + op.substr(1, op.length - 2)
    const array = []
    parts[3].split(",").forEach(function (value) {
      array.push(typedValue(value))
    })
    value = {}
    value[op] = array.length == 1 ? array[0] : array
  } else {
    value = typedValue(parts[3])
    if (op == ">") value = { [Op.gt]: value }
    else if (op == ">=") value = { [Op.gte]: value }
    else if (op == "<") value = { [Op.lt]: value }
    else if (op == "<=") value = { [Op.lte]: value }
  }

  hash.key = key
  hash.value = value
  return hash
}

module.exports = function (query, options) {
  return { criteria: {}, options: {}, links: function (url, totalCount) {} }
}
