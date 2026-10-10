import { IUser } from '../../models/User';

// Extending the global Express namespace to include our User model
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}