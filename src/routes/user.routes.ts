import { Router } from "express";
import { UserControllers } from "../controllers/user.controllers";


export const User = Router();

User.get('/one/:id', UserControllers.GetOneUser)

User.get('/all', UserControllers.GetAllUsers)

User.post('/signup', UserControllers.CreateUser )

User.post('/login', UserControllers.LoginUser)

User.post('/logout', UserControllers.LogOutUser)