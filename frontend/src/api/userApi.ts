import axios from 'axios';
import { User } from '../types/User';

const API = 'http://localhost:3000/api/user';

export const getUsers = () =>
  axios.get<User[]>(API);

export const getUserById = (id: number) =>
  axios.get<User>(`${API}/${id}`);

export const createUser = (body: User) =>
  axios.post<User>(API, body);

export const updateUser = (id: number, body: User) =>
  axios.put<User>(`${API}/${id}`, body);

export const deleteUser = (id: number) =>
  axios.delete(`${API}/${id}`);
