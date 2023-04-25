/** User class for message.ly */
const db = require('../db');
const bcrypt = require('bcrypt');
const {BCRYPT_WORK_FACTOR} = require('../config');
const ExpressError = require("../expressError");


/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, 
        phone, join_at, last_login_at) 
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT username, password
      FROM users
      WHERE username = $1`,
      [username]);
    const user = results.rows[0];
    if (!user) {
      throw new ExpressError("Invalid username/password", 400)
    }
    const userAutheniticated = await bcrypt.compare(password, user.password);
    return userAutheniticated;
  };

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const results = await db.query(
      `UPDATE users 
      SET last_login_at = current_timestamp
      WHERE username = $1 
      RETURNING last_login_at`,
      [username]);
    if (!results.rows[0]) {
      throw new ExpressError(`User ${username} not found`, 404);
    }
    return results.rows[0];
  };


  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() { 
    const results = await db.query(
      `SELECT username, first_name, last_name, phone 
      FROM users
      ORDER BY username`
    );
    return results.rows;
  };

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users 
      WHERE username = $1`,
      [username]
    );
    if (!results.rows[0]) {
      throw new ExpressError(`User ${username} not found`, 404);
    }
    return results.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const results = await db.query(`
      SELECT m.id,
             m.to_username,
             u.first_name,
             u.last_name,
             u.phone,
             m.body, 
             m.sent_at,
             m.read_at
      FROM messages AS m 
      JOIN users AS u
      ON m.to_username = u.username
      WHERE from_username = $1
      ORDER BY sent_at DESC`,
      [username]);
    if (!results.rows) {
      throw new ExpressError(`No messages found from ${username}`, 404)
    }
    return results.rows.map(r => ({
      id:r.id,
      to_user: {
        username: r.to_username,
        first_name:r.first_name,
        last_name: r.last_name,
        phone: r.phone
      },
      body:r.body,
      sent_at:r.sent_at,
      read_at:r.read_at,
    }));
   };

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id,
             m.from_username,
             u.first_name,
             u.last_name,
             u.phone,
             m.body, 
             m.sent_at,
             m.read_at
      FROM messages AS m 
      JOIN users AS u
      ON m.from_username = u.username
      WHERE to_username = $1
      ORDER BY sent_at DESC`,
      [username]);
    if (!results.rows) {
        throw new ExpressError(`No messages found to ${username}`, 404)
      }
      return results.rows.map(r => ({
        id:r.id,
        from_user: {
          username: r.from_username,
          first_name:r.first_name,
          last_name: r.last_name,
          phone: r.phone
        },
        body:r.body,
        sent_at:r.sent_at,
        read_at:r.read_at,
      }));
  };
};


module.exports = User;