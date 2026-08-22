// src/services/authService.js
// Mock authentication service with localStorage persistence.
// Structured for easy replacement with a real Django REST API later.

import { mockUsers } from '../data/mockData';
import { read, write, STORAGE_KEYS } from './storageService';

// Simulate network latency
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Strips the password from a user object before returning it.
 * We never expose passwords in state or localStorage.
 */
function safeUser(user) {
  const { password: _pw, ...safe } = user;
  return safe;
}

/**
 * Helper to get the current list of users from storage.
 * Seeds with mockUsers if empty.
 */
function getUsers() {
  let users = read(STORAGE_KEYS.USERS);
  if (!users) {
    users = [...mockUsers];
    write(STORAGE_KEYS.USERS, users);
  }
  return users;
}

export function getUserById(id) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  return user ? safeUser(user) : null;
}

/**
 * login(email, password)
 */
export async function login(email, password) {
  await delay();

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const users = getUsers();
  const found = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!found) {
    throw new Error('Invalid email or password. Please try again.');
  }

  return {
    user: safeUser(found)
  };
}

/**
 * register(name, email, password)
 */
export async function register(name, email, password) {
  await delay();

  if (!name || !name.trim()) {
    throw new Error('Full name is required.');
  }
  if (!email || !email.trim()) {
    throw new Error('Email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const users = getUsers();
  const existing = users.find(
    u => u.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    avatarInitials: name.trim().slice(0, 2).toUpperCase(),
    password, // Stored in mock DB, stripped in safeUser
  };

  users.push(newUser);
  write(STORAGE_KEYS.USERS, users);

  return {
    user: safeUser(newUser)
  };
}

/**
 * logout()
 */
export async function logout() {
  await delay(150);
  return { success: true };
}
