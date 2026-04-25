import admin from "firebase-admin";
import type {
  BaseMessage,
  Message,
} from "firebase-admin/lib/messaging/messaging-api";
import { initializeApp } from "firebase/app";
import {
  SignInMethod,
  getAuth,
  signInWithCustomToken,
  signInWithEmailAndPassword,
} from "firebase/auth";
import logger from "../logger";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../../../firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount.server),
});
const messaging = admin.messaging();
const auth = admin.auth();

const client = initializeApp(serviceAccount.client);
const authClient = getAuth(client);

export async function verifyIdTokenOauth(idToken: string) {
  const decoded = await auth.verifyIdToken(idToken);
  //email
  if (decoded.aud !== serviceAccount.server.project_id) {
    return null;
  }
  return {
    id: decoded.custom_id,
    name: decoded.name,
    uid: decoded.uid,
    email: decoded.email,
    phoneNumber: decoded.phone_number,
    photoURL: decoded.picture,
    role: decoded.role,
    signInProvider: decoded.firebase.sign_in_provider,
  };
}

export async function verifyIdToken(idToken: string) {
  try {
    const decoded = await auth.verifyIdToken(idToken);

    if (decoded.aud !== serviceAccount.server.project_id || !decoded.email) {
      return null;
    }

    return {
      id: decoded.custom_id,
      uid: decoded.uid,
      email: decoded.email,
      phoneNumber: decoded.phone_number,
      photoURL: decoded.picture,
      role: decoded.role,
      isActive: decoded.isActive,
      hasChangedPassword: decoded.hasChangedPassword,
    };
  } catch (error) {
    logger.error(`verifyIdToken: ${error}`);
    throw error;
  }
}

export async function getUser(uid: string) {
  return await auth.getUser(uid);
}

export async function getUserByEmail(email: string) {
  try {
    return await auth.getUserByEmail(email);
  } catch (err) {
    logger.error(`getUserByEmail: ${err}`);
    return;
  }
}

export async function deleteUser(uid: string) {
  return await auth.deleteUser(uid);
}

export async function setCustomUserClaims(uid: string, claims: object) {
  await auth.setCustomUserClaims(uid, claims);
}

export async function verifyEmail(uid: string) {
  return await auth.updateUser(uid, {
    emailVerified: true,
  });
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
  name?: string,
  uid?: string,
) {
  try {
    return await auth.createUser({
      uid,
      email,
      password,
      displayName: name,
      emailVerified: true,
    });
  } catch (err) {
    logger.error(`createUserWithEmailAndPassword: ${err}`);
    throw err;
  }
}

export async function verifyEmailAndPassword(email: string, password: string) {
  return await signInWithEmailAndPassword(authClient, email, password);
}

export async function changeUserPasswordWithOldPassword(
  email: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await verifyEmailAndPassword(email, oldPassword);
  return await auth.updateUser(user.user.uid, {
    password: newPassword,
  });
}

export async function changeUserPassword(uid: string, newPassword: string) {
  return await auth.updateUser(uid, {
    password: newPassword,
  });
}

export async function sendNotification(
  tokens: string | string[] | null | undefined,
  data: {
    notification: {
      title: string;
      body: string;
    };
    data: {
      type: string;
      data?: string;
    };
  },
  url?: string,
  isTopic = false,
  sound?: string,
) {
  if (!tokens || (Array.isArray(tokens) && tokens.length === 0)) {
    return;
  }

  const notification: BaseMessage = {
    data: data.data,
    notification: data.notification,
    apns: {
      payload: {
        aps: {
          // contentAvailable: true,
        },
      },
    },
  };
  if (url) {
    notification.webpush = {
      fcmOptions: {
        link: url,
      },
    };
  }

  if (sound) {
    notification.android = {
      notification: {
        sound,
        channelId: "affiliate", // TODO: need change
      },
    };

    if (!notification.apns) {
      notification.apns = {
        payload: {
          aps: {
            sound,
          },
        },
      };
    } else if (!notification.apns.payload) {
      notification.apns.payload = {
        aps: {
          sound,
        },
      };
    } else {
      notification.apns.payload.aps.sound = sound;
    }
  }
  try {
    if (typeof tokens === "string") {
      if (isTopic) {
        await messaging.send({
          ...notification,
          topic: tokens,
        });
      } else {
        await messaging.send({
          ...notification,
          token: tokens,
        });
      }
    } else {
      await messaging.sendEachForMulticast({
        ...notification,
        tokens,
      });
    }

    logger.info(`sendNotification: ${data.notification.body}`);
  } catch (err) {
    logger.error(`sendNotification: ${err}`);
    throw err;
  }
}

export async function sendBatchNotification(messages: Message[]) {
  try {
    return await messaging.sendEach(messages);
  } catch (err) {
    logger.error(`sendNotification: ${err}`);
    throw err;
  }
}
export async function addToTopic(topic: string, tokens: string | string[]) {
  try {
    await messaging.subscribeToTopic(tokens, topic);
  } catch (err) {
    logger.error(`addToTopic: ${err}`);
  }
}

export async function removeFromTopic(
  topic: string,
  tokens: string | string[],
) {
  await messaging.unsubscribeFromTopic(tokens, topic);
}

export async function createCustomToken(uid: string) {
  return await auth.createCustomToken(uid);
}

export async function loginWithCustomToken(token: string) {
  let firebaseUser = null;
  try {
    firebaseUser = await signInWithCustomToken(authClient, token);
  } catch (err) {
    logger.error(`loginWithCustomToken: ${err}`);
  }
  return firebaseUser;
}

export async function linkWithSignInPassword(
  uid: string,
  email: string,
  password: string,
) {
  return await admin.auth().updateUser(uid, {
    email,
    password,
  });
}

export async function updateCustomClaim(
  uid: string,
  updatedClaim: object,
): Promise<void> {
  try {
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    const newClaims = {
      ...currentClaims,
      ...updatedClaim,
    };

    await admin.auth().setCustomUserClaims(uid, newClaims);
  } catch (error) {
    logger.error(`Error updating custom claims: ${error}`);
    throw error;
  }
}
