const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../db');
const User = require('../models/user');
const Message = require('../models/message');

let u1, u2, _token, msg, msg2;

describe('Message Routes Test', function () {

    beforeEach(async function () {
        await db.query('DELETE FROM messages');
        await db.query('DELETE FROM users');
        // create first user that will be sending the messages that we'll test
        u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });
        // second user will create a message that we'll test with first user
        // marking this message as read in /messages/:id/read route
        u2 = await User.register({
            username: "test2",
            password: "password",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550022",
        });
        // login first user and get a token that we'll store in global variable
        let currentUser = await request(app).post('/auth/login').send({ username: "test1", password: "password" });
        _token = currentUser.body.token;

        // message we'll test in /messages/:id route
        msg = await Message.create({
            from_username: u1.username,
            to_username: u2.username,
            body: "Hello Test2, this is Test1"
        });
        // message we'll test in /messages/:id/read route
        msg2 = await Message.create({
            from_username: u2.username,
            to_username: u1.username,
            body: "Hello Test1, this is Test2"
        });
    });

    // close all db connections
    afterAll(async () => {
        await db.end();
    })

    // only a logged in user that is listed in the message 
    // as to_user or from_user can access the message.
    describe('GET /:id', function() {
        test('Get message by message id', async function() {
            let results = await request(app).get(`/messages/${msg.id}`).send({_token})
            expect(results.statusCode).toBe(200);
            expect(results.body).toEqual({message:{
                    id: msg.id,
                    from_user: {
                      username: u1.username,
                      first_name: u1.first_name,
                      last_name: u1.last_name,
                      phone: u1.phone,
                    },
                    to_user: {
                      username: u2.username,
                      first_name: u2.first_name,
                      last_name: u2.last_name,
                      phone: u2.phone,
                    },
                    body: msg.body,
                    sent_at: expect.any(String),
                    read_at: null,
            }});
        });
        test('Unable to view message details because of a missing token', async function () {
            let response = await request(app).get(`/messages/${msg2.id}`).send();
            expect(response.statusCode).toBe(401);
        })

        test('Unable to view message details because of a wrong token', async function () {
            let response = await request(app).get(`/messages/${msg2.id}`).send({ _token: "wrong"  });
            expect(response.statusCode).toBe(401);
        })
    })

    describe('POST /', function() {
        test('Send a new message to another user if logged in', async function() {
            let results = await request(app).post('/messages/').send({
                from_username:u1.username, to_username:u2.username, body:'Hello Testy2', _token
            })
            expect(results.statusCode).toBe(200);
            expect(results.body).toEqual({message:{
                id:expect.any(Number), 
                from_username:u1.username,
                to_username:u2.username,
                body:"Hello Testy2",
                sent_at:expect.any(String)}});
        })
        test('Unable to create new message because of a missing token', async function () {
            let response = await request(app).post(`/messages/`).send();
            expect(response.statusCode).toBe(401);
        });

        test('Unable to create new message because of a wrong token', async function () {
            let response = await request(app).post(`/messages/`).send({ _token: "wrong"  });
            expect(response.statusCode).toBe(401);
        });
    })

    describe('POST /:id/read', function() {
        test('Mark message as read by logged in user', async function() {
            let results = await request(app).post(`/messages/${msg2.id}/read`).send({_token});
            expect(results.statusCode).toBe(200);
            expect(results.body).toEqual({message:{
                id:expect.any(Number),
                read_at:expect.any(String),
            }});
        });
        test('Unable to mark message as read because of a missing token', async function () {
            let response = await request(app).post(`/messages/${msg2.id}/read`).send();
            expect(response.statusCode).toBe(401);
        })

        test('Unable to mark message as read because of a wrong token', async function () {
            let response = await request(app).post(`/messages/${msg2.id}/read`).send({ _token: "wrong"  });
            expect(response.statusCode).toBe(401);
        })
    });
})