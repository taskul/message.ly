const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../db');
const User = require('../models/user');
const Message = require('../models/message');

let u1;
let _token;
let wrongToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

describe('User Routes Test', function () {

    beforeEach(async function () {
        await db.query('DELETE FROM messages');
        await db.query('DELETE FROM users');

        u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });
        u2 = await User.register({
            username: "test2",
            password: "password",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155550022",
        });
        let currentUser = await request(app).post('/auth/login').send({ username: "test1", password: "password" });
        _token = currentUser.body.token;
    });

    // get all users
    describe('GET /', function () {
        test('Get all users', async function () {
            let response = await request(app).get('/users')
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ users: [u1] })
        })
    })

    // get user by username, only owner of the profile can view their user profile
    describe('GET /:username', function () {
        test('Get user by username', async function () {
            let response = await request(app).get(`/users/${u1.username}`).send({ _token });
            expect(response.statusCode).toBe(200);
            const { username, first_name, last_name, phone } = u1;
            expect(response.body).toEqual({
                user: {
                    username,
                    first_name,
                    last_name,
                    phone,
                    "join_at": expect.any(String),
                    "last_login_at": expect.any(String)
                }
            })
        })

        test('Unable to view user info because of missing token', async function () {
            let response = await request(app).get(`/users/${u1.username}`).send();
            expect(response.statusCode).toBe(500);
        })

        test('Unable to view user info because of wrong token', async function () {
            _token = wrongToken;
            let response = await request(app).get(`/users/${u1.username}`).send({ _token });
            expect(response.statusCode).toBe(500);
        })
    })

    // view messages to the user, :username must matched logged in user in order to view messages
    describe('GET /:username/to', function () {
        test('Get messages addressed to the user', async function () {
            const msg = await Message.create({
                from_username: u1.username,
                to_username: u2.username,
                body: "Hello Test2, this is Test1"
            })
            let resonse = (await request(app).get(`/${u1.username}/to`)).listenerCount({ _token });
            expect(resonse.statusCode).toBe(200);
            expect(resonse.body).toEqual(msg)
        })
        test('Unable to view user info because of missing token', async function () {
            let response = await request(app).get(`/users/${u1.username}`).send();
            expect(response.statusCode).toBe(500);
        })

        test('Unable to view user info because of wrong token', async function () {
            _token = wrongToken;
            let response = await request(app).get(`/users/${u1.username}`).send({ _token });
            expect(response.statusCode).toBe(500);
        })
    })

    // view messages from the user, :username must matched logged in user in order to view messages
    describe('GET /:username/from', function () {
        test('Get messages addressed to the user', async function () {
            const msg = await Message.create({
                from_username: u2.username,
                to_username: u1.username,
                body: "Hello Test1, this is Test2"
            })
            let resonse = (await request(app).get(`/${u1.username}/to`)).listenerCount({ _token });
            expect(resonse.statusCode).toBe(200);
            expect(resonse.body).toEqual(msg)
        })
    })
});