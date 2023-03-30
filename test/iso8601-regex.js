const assert = require("assert")
const tap = require("tap")
const iso8601 = require("../lib/iso8601-regex")

tap.pass("this is fine")

tap.test("iso8601-regex", t1 => {
  t1.test("should match YYYY", t2 => {
    assert.ok(iso8601.test("2000"))
    t2.end()
  })
  t1.test("should match YYYY-MM", t2 => {
    assert.ok(iso8601.test("2000-04"))
    t2.end()
  })
  t1.test("should match YYYY-MM-DD", t2 => {
    assert.ok(iso8601.test("2000-04-01"))
    t2.end()
  })
  t1.test("should match YYYY-MM-DDThh:mmZ", t2 => {
    assert.ok(iso8601.test("2000-04-01T12:00Z"), "Z")
    assert.ok(iso8601.test("2000-04-01T12:00-08:00"), "-08:00")
    assert.ok(iso8601.test("2000-04-01T12:00+01:00"), "+01:00")
    t2.end()
  })
  t1.test("should match YYYY-MM-DDThh:mm:ssZ", t2 => {
    assert.ok(iso8601.test("2000-04-01T12:00:30Z"), "Z")
    assert.ok(iso8601.test("2000-04-01T12:00:30-08:00"), "-08:00")
    assert.ok(iso8601.test("2000-04-01T12:00:30+01:00"), "+01:00")
    t2.end()
  })
  t1.test("should match YYYY-MM-DDThh:mm:ss.sZ", t2 => {
    assert.ok(iso8601.test("2000-04-01T12:00:30.250Z"), "Z")
    assert.ok(iso8601.test("2000-04-01T12:00:30.250-08:00"), "-08:00")
    assert.ok(iso8601.test("2000-04-01T12:00:30.250+01:00"), "+01:00")
    t2.end()
  })
  t1.test("should not match time without timezone", t2 => {
    assert.ok(!iso8601.test("2000-04-01T12:00"), "hh:mm")
    assert.ok(!iso8601.test("2000-04-01T12:00:00"), "hh:mm:ss")
    assert.ok(!iso8601.test("2000-04-01T12:00:00.000"), "hh:mm:ss.s")
    t2.end()
  })
  t1.test("should not match out of range month", t2 => {
    assert.ok(!iso8601.test("2000-00"), "00")
    assert.ok(!iso8601.test("2000-13"), "13")
    t2.end()
  })
  t1.test("should not match out of range day", t2 => {
    assert.ok(!iso8601.test("2000-04-00"), "00")
    assert.ok(!iso8601.test("2000-04-32"), "32")
    t2.end()
  })
  t1.test("should not match out of range hour", t2 => {
    assert.ok(!iso8601.test("2000-04-01T24:00Z"))
    t2.end()
  })
  t1.test("should not match out of range minute", t2 => {
    assert.ok(!iso8601.test("2000-04-01T12:60Z"))
    t2.end()
  })
  t1.test("should not match out of range second", t2 => {
    assert.ok(!iso8601.test("2000-04-01T12:00:60Z"))
    t2.end()
  })
  t1.test("should not match time without timezone", t2 => {
    assert.ok(!iso8601.test("2000-04-01T12:00"), "hh:mm")
    assert.ok(!iso8601.test("2000-04-01T12:00:00"), "hh:mm:ss")
    assert.ok(!iso8601.test("2000-04-01T12:00:00.000"), "hh:mm:ss.s")
    t2.end()
  })
  t1.end()
})
