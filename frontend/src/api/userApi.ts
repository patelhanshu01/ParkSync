import apiClient from './client';
import { User } from '../types/User';

const USER_BASE = '/user';

export const getUsers = () =>
  apiClient.get<User[]>(USER_BASE);

export const getUserById = (id: number) =>
  apiClient.get<User>(`${USER_BASE}/${id}`);

export const createUser = (body: User) =>
  apiClient.post<User>(USER_BASE, body);

export const updateUser = (id: number, body: User) =>
  apiClient.put<User>(`${USER_BASE}/${id}`, body);

export const deleteUser = (id: number) =>
  apiClient.delete(`${USER_BASE}/${id}`);
