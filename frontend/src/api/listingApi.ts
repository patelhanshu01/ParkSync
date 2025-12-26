import axios from 'axios';
import { Listing } from '../types/Listing';

const API = 'http://localhost:3000/api/listings';

export const getListings = (params?: any) => axios.get<{ results: Listing[] }>(API, { params });
export const getListingById = (id: number) => axios.get<Listing>(`${API}/${id}`);
export const createListing = (body: Partial<Listing>) => axios.post<Listing>(API, body);
export const updateListing = (id: number, body: Partial<Listing>) => axios.put<Listing>(`${API}/${id}`, body);
export const deleteListing = (id: number) => axios.delete(`${API}/${id}`);
