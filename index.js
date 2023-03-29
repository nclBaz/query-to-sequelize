const querystring = require("querystring")
const iso8601 = require("./lib/iso8601-regex")

// Convert comma separated list to a sequelize projection (attributes array).
// for example f('field1,field2,field3') -> ['field1','field2','field3']
function fieldsToAttributes(fields) {
  if (!fields) return null
  return fields.split(",")
}

// Convert comma separated list to a sequelize projection (attributes object)
// for example f('field2') -> {field2:false}
function omitFieldsToAttributes(omitFields) {
  if (!omitFields) return null
  return { exclude: omitFields.split(",") }
}

module.exports = function (query, options) {
  return { criteria: {}, options: {}, links: function (url, totalCount) {} }
}
