'use strict'

const { test } = require('node:test')
const build = require('../app')

test('request the "/" route', async t => {
    t.plan(1)
    const app = build()

    const response = await app.inject({
        method: 'GET',
        url: 'url'
    })
    t.assert.strictEqual(response.statusCode, 200, 'return a status code of 200')
})