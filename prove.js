const q2s = require("./index.js")

const query = "id=a,b&name=/^john/i&age>21&date=1997-07&omit=name,age&sort=name,-age&offset=10&limit=10"

console.log(q2s(query).criteria)
