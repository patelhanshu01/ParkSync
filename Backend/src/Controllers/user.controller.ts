import { Request, Response } from 'express';
import { UserService } from '../Services/user.service';

const service = new UserService();

export const getAllUsers = async (req: Request, res: Response) => {
  const data = await service.getAll();
  res.json(data);
};

export const getUserById = async (req: Request, res: Response) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: "User not found" });
  res.json(data);
};

export const createUser = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

export const updateUser = async (req: Request, res: Response) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: "User not found" });
  res.json(data);
};

export const deleteUser = async (req: Request, res: Response) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "User not found" });
  res.json({ message: "Deleted successfully" });
};
