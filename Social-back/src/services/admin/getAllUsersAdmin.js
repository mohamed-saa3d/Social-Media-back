import User from '../../models/User.js';

export default async function getAllUsersAdmin() {
  return User.find().select('-password').sort({ createdAt: -1 });
}
