import chalk from "chalk";
import bcrypt from 'bcrypt'
import Token from "../core/config/jwt";
import { Response, Request } from "express";
import { HttpCode } from "../core/constants";
import { PrismaClient } from "@prisma/client";
import { ExpressValidator } from "express-validator";

const Prisma = new PrismaClient()

export const UserControllers = {
    GetOneUser : async (req : Request, res : Response) => {
        const user_id = req.params.id;
        try {
            const user = await Prisma.user.findUnique({ 
                where: { 
                    user_id: user_id
                },
                select: {
                    user_id: true,
                    nom: true,
                    email: true
                }
            });
            if (!user) {
                return res.status(HttpCode.NOT_FOUND).json({ message: "utilisateur non trouvé" });
            }
            res.json(user);
        } catch (error) {
            console.error(chalk.red(error));
            res.status(HttpCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        }
    },
    GetAllUsers: async (req : Request, res : Response) => {
        try {
            const users = await Prisma.user.findMany({
                select: {
                    user_id: true,
                    nom: true,
                    email: true
                }
            });
            res.json(users);
        } catch (error) {
            console.error(chalk.red(error));
            res.status(HttpCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
        }
    },
    CreateUser: async (req : Request, res : Response) =>  {
        try {
            const { email, nom, motDePasse } = req.body;
            if (!email || !nom || !motDePasse) {
              return res.status(HttpCode.BAD_REQUEST).json({
                message: "Veuillez remplir tous les champs"
              });
            }

            const newPassword = await bcrypt.hash(motDePasse, 10);

      
            const user = await Prisma.user.create({
              data: {
                nom,
                email,
                motDePasse: newPassword
              }
            });
    
            res.status(HttpCode.CREATED).json(user);
          } catch (error) {
            res.status(HttpCode.INTERNAL_SERVER_ERROR).json({ message: "Erreur lors de la création de l'utilisateur"});
            console.error(chalk.red(error));
        }
    },
    LoginUser: async (req : Request, res : Response) => {
        try {
        
            const { email, motDePasse } = req.body

            const user = await Prisma.user.findFirst({
                where: {
                    email
                },
            })

            if (user) {
                const comparePass = await bcrypt.compare(motDePasse, user.motDePasse)
                if (comparePass) {
                    
                    const accessToken = Token.GenerateAccessToken(user)
                    const refreshToken = Token.GenerateRefreshToken(user)

                    user.motDePasse = ""
                    
                    res.cookie(`${user.nom}-cookie`, refreshToken, { 
                    httpOnly: true, 
                    secure: true,
                    maxAge : 30 * 24 * 60 * 1000
                     })
                    console.log(accessToken)
                    res.json({ message: "L'utilisateur s'est connecté avec succès" }).status(HttpCode.OK)
                } else res.json({ message: "les informations saisies sont invalide" })
            } else console.log(chalk.red("aucun utilisateur trouvé"))

        } catch (error) {
            console.log(chalk.red(error))
        }
    },
    LogOutUser: async (req : Request, res : Response) => {
        try {
         
            const { email } = req.body

            const user = await Prisma.user.findFirst({
                where: {
                    email
                }
            })
            if (user) {
                   
                const accessToken = req.headers.authorization
                const refreshToken = req.cookies['control-cookie']
                
                if (!accessToken || !refreshToken)
                    return res.status(HttpCode.UNAUTHORIZED).json({ message: " aucun Token disponible ou expiré" });

                const decodedUser = await Token.VerifyAccessToken(refreshToken);
                if (decodedUser) {
                    res.clearCookie('control-cookie')
                    console.log("l'utilisateur c'est deconnecter")
                    return res.status(HttpCode.OK).json({ message: "L'utilisateur s'est déconnecté avec succès" })
                } else res.status(HttpCode.INTERNAL_SERVER_ERROR).json({ message: "Token non valide ou expiré" })
            }
        } catch (error) {
            console.log(chalk.red(error))
            res.status(HttpCode.INTERNAL_SERVER_ERROR).json({ message: "Erreur lors de la déconnexion de l'utilisateur" });
        }
    }
}

