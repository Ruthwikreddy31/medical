import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDb } from "../config/db.js";
import { User } from "../models/User.js";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8)
});

export async function register(request, response, next) {
  try {
    const parsed = authSchema.safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Invalid registration input", issues: parsed.error.flatten() });
    }

    const db = await getDb();
    if (!db) {
      return response.status(503).json({ message: "MongoDB is required for registration" });
    }

    const email = parsed.data.email.toLowerCase();
    const existingUser = await db.collection(User.collection).findOne({ email });
    if (existingUser) {
      return response.status(409).json({ message: "An account with this email already exists" });
    }

    const user = {
      name: parsed.data.name || "Healthcare User",
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      createdAt: new Date()
    };
    const result = await db.collection(User.collection).insertOne(user);

    response.status(201).json(buildAuthResponse({ ...user, _id: result.insertedId }));
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const parsed = authSchema.omit({ name: true }).safeParse(request.body);
    if (!parsed.success) {
      return response.status(400).json({ message: "Invalid login input", issues: parsed.error.flatten() });
    }

    const db = await getDb();
    if (!db) {
      return response.status(503).json({ message: "MongoDB is required for login" });
    }

    const user = await db.collection(User.collection).findOne({ email: parsed.data.email.toLowerCase() });
    const isValidPassword = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
    if (!isValidPassword) {
      return response.status(401).json({ message: "Invalid email or password" });
    }

    response.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function googleLogin(request, response, next) {
  try {
    const { credential } = request.body;
    if (!credential) {
      return response.status(400).json({ message: "Credential token is required" });
    }

    let payload;
    // Fallback for developer mock testing
    if (credential === "mock-google-token" && (!process.env.GOOGLE_CLIENT_ID || process.env.NODE_ENV !== "production")) {
      payload = {
        sub: "mock-google-sub-id",
        email: "mockgoogleuser@example.com",
        name: "Mock Google User"
      };
    } else {
      // Direct verification via Google TokenInfo endpoint
      const verificationResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!verificationResponse.ok) {
        return response.status(401).json({ message: "Invalid Google credential token" });
      }
      
      const verificationData = await verificationResponse.json();
      
      // If client ID is configured, verify the audience matches
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId && verificationData.aud !== clientId) {
        return response.status(401).json({ message: "Audience mismatch on Google credential token" });
      }

      payload = {
        sub: verificationData.sub,
        email: verificationData.email,
        name: verificationData.name || "Google User"
      };
    }

    const db = await getDb();
    if (!db) {
      return response.status(503).json({ message: "MongoDB is required for Google login" });
    }

    const email = payload.email.toLowerCase();
    
    // Find user by email or by googleId
    let user = await db.collection(User.collection).findOne({
      $or: [{ email }, { googleId: payload.sub }]
    });

    if (!user) {
      // Create user if not exists
      user = {
        name: payload.name,
        email,
        googleId: payload.sub,
        createdAt: new Date()
      };
      const result = await db.collection(User.collection).insertOne(user);
      user._id = result.insertedId;
    } else if (!user.googleId) {
      // If user exists with password but has no googleId link, link it
      await db.collection(User.collection).updateOne(
        { _id: user._id },
        { $set: { googleId: payload.sub } }
      );
      user.googleId = payload.sub;
    }

    response.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}


function buildAuthResponse(user) {
  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "8h" }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    }
  };
}
