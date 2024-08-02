import jwt from 'jsonwebtoken';
import { envs } from './env';

const Tokens = {
    GenerateAccessToken: (payload : any) => {
        return jwt.sign(payload, envs.JWT_ACCESS_TOKEN as string, { expiresIn: '1h' });
    },
    GenerateRefreshToken: (payload : any) => {
        return jwt.sign(payload, envs.JWT_ACCESS_TOKEN as string, {expiresIn: '30d' });
    },
    VerifyAccessToken: (token: string) => {
        return jwt.verify(token, envs.JWT_ACCESS_TOKEN as string)
    },
}
export default Tokens;