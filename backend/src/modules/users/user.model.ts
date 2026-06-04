// Re-export the canonical User model from auth.model to avoid re-registering
// the 'User' model name with Mongoose (which throws OverwriteModelError).
import User from '../auth/auth.model';
export { User };
