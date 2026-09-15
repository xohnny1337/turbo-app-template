import { getApp } from "@react-native-firebase/app";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore } from "@react-native-firebase/firestore";

/**
 * Firebase singletons. The native app is configured automatically from
 * google-services.json / GoogleService-Info.plist at build time.
 */
export const firebaseApp = getApp();
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
