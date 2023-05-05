const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../db');
const User = require('../models/user');
const Message = require('../models/message');

// setting global variables for the tests
let u1, u2, msg, msg2, _token;

describe('User Routes Test', function () {

    beforeEach(async function () {
        await db.query('DELETE FROM messages');
        await db.query('DELETE FROM users');

        // create first user which will be the user we'll use for testing
        u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });
        // second user is needed for creating a message for first user
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

        // create a first message from second user to first user
        msg = await Message.create({
            from_username: u2.username,
            to_username: u1.username,
            body: "Hello Test1, this is Test2"
        })
        // create a second message from first user to second user
        msg2 = await Message.create({
            from_username: u1.username,
            to_username: u2.username,
            body: "Hello Test2, this is Test1"
        })
    });

    // close all db connections
    afterAll(async () => {
        await db.end();
    })

    // get all users
    describe('GET /', function () {
        test('Get all users', async function () {
            let response = await request(app).get('/users')
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ users: [u1, u2] })
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
            expect(response.statusCode).toBe(401);
        })

        test('Unable to view user info because of wrong token', async function () {
            let response = await request(app).get(`/users/${u1.username}`).send({ _token: "wrong"  });
            expect(response.statusCode).toBe(401);
        })
    })

    // view messages to the user, :username must matched logged in user in order to view messages
    describe('GET /:username/to', function () {
        test('Get messages addressed to the user', async function () {
            let resonse = await request(app).get(`/users/${u1.username}/to`).send({ _token });
            expect(resonse.statusCode).toBe(200);
            expect(resonse.body).toEqual({messages:[{
                id:expect.any(Number),
                body:"Hello Test1, this is Test2",
                read_at:null,
                sent_at:expect.any(String),
                from_user: {
                    first_name:"Test2",
                    last_name:"Testy2",
                    phone:"+14155550022",
                    username:"test2"
                }},

            ]})
        })
        test('Unable to view messages to the user because of missing token', async function () {
            let response = await request(app).get(`/users/${u1.username}/to`).send();
            expect(response.statusCode).toBe(401);
        })

        test('Unable to view messages to the user because of wrong token', async function () {
            let response = await request(app).get(`/users/${u1.username}/to`).send({ _token: "wrong" });
            expect(response.statusCode).toBe(401);
        })
    })

    // view messages from the user, :username must matched logged in user in order to view messages
    describe('GET /:username/from', function () {
        test('Get messages addressed to the user', async function () {
            let resonse = await request(app).get(`/users/${u1.username}/from`).send({ _token });
            expect(resonse.statusCode).toBe(200);
            expect(resonse.body).toEqual({messages:[{
                id:expect.any(Number),
                body:"Hello Test2, this is Test1",
                read_at:null,
                sent_at:expect.any(String),
                to_user: {
                    first_name:"Test2",
                    last_name:"Testy2",
                    phone:"+14155550022",
                    username:"test2"
            }},

            ]})
        })
    })
        test('Unable to view messages for the user because of missing token', async function () {
            let response = await request(app).get(`/users/${u1.username}/from`).send();
            expect(response.statusCode).toBe(401);
        })

        test('Unable to view messages for the user because of wrong token', async function () {
            let response = await request(app).get(`/users/${u1.username}/from`).send({ _token: "wrong" });
            expect(response.statusCode).toBe(401);
        })
});