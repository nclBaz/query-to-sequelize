const querystring = require("querystring")
const iso8601 = require("./lib/iso8601-regex")

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

module.exports = function (query, options) {
  return { criteria: {}, options: {}, links: function (url, totalCount) {} }
}
