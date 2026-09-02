/** Shared test data + generators. Mirrors the constants/helpers in the old
 *  suite's Config.py. */

export function randomChars(n = 7): string {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < n; i++) s += alpha[Math.floor(Math.random() * alpha.length)];
  return s;
}

/** Fresh address so each registration test creates its own account. */
export function uniqueEmail(prefix = 'auto'): string {
  return `${prefix}${randomChars(7)}${Date.now() % 1_000_000}@gmail.com`;
}

export const REG = {
  firstName: 'kumar',
  lastName: 'file',
  firstNameWithSpaces: '  kumar  ',
  password: 'Test@123',
  mobile: '9876543210',
  invalidEmail: 'invalidusergmail.com',
  invalidEmailFormat: 'test@test',
};

export const LOGIN = {
  invalidEmail: 'invaliduse22rgmail.com',
  unregisteredEmail: 'can@gmail.com',
};

export const credentials = {
  get username(): string {
    const v = process.env.CANONIZER_USERNAME;
    if (!v) throw new Error('CANONIZER_USERNAME not set (see .env.example)');
    return v;
  },
  get password(): string {
    const v = process.env.CANONIZER_PASSWORD;
    if (!v) throw new Error('CANONIZER_PASSWORD not set (see .env.example)');
    return v;
  },
};
