const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const db = require('../db');
const User = require('../models/user');

let u1;

describe('User Routes Test', function () {
    
    beforeEach( async function () {
        await db.query('DELETE FROM messages');
        await db.query('DELETE FROM users');

        u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });
    });

    // get all users
    describe('GET /', function() {
        test('Get all users', async function () {
            let response = await request(app).get('/users')
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({users:[u1]})
        })
    })

    describe('GET /:username', function() {
        test('Get user by username', async function() {
            let currentUser = await request(app).post('/auth/login').send({ username: "test1", password: "password" });
            let _token = currentUser.body.token;
            let response = await request(app).get(`/users/${u1.username}`).send({_token});
            expect(response.statusCode).toBe(200);
            const {username, first_name, last_name, phone } = u1;
            expect(response.body).toEqual({user:{username, 
                                            first_name, 
                                            last_name, 
                                            phone,
                                            "join_at":expect.any(String),
                                            "last_login_at": expect.any(String)}})
        })
    })
});