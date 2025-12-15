import jwt from "jsonwebtoken";

const createToken = (user: any) => {
  return jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET_KEY as string,
    {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    }
  );
};

export default createToken;
