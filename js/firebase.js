/* === Imports === */
import { initializeApp } from "firebase/app";
import { doc, getFirestore, collection, addDoc, Timestamp, serverTimestamp, getDoc, getDocs, onSnapshot, QuerySnapshot,  query, where, orderBy, updateDoc, deleteDoc} from "firebase/firestore";

import { getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile,
} from "firebase/auth";

import { collectionName, allCardsEl } from ".";

import { clearAuthFields, clearAllCards, renderCards } from "./functionUI";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

/* === Firebase Setup === */
export const firebaseConfig = {
    apiKey: "AIzaSyAikvvvG6GTvuSzl-FeyJcKGypZNnDtHos",
    authDomain: "playground-b6f3b.firebaseapp.com",
    databaseURL: "https://playground-b6f3b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "playground-b6f3b",
    storageBucket: "playground-b6f3b.appspot.com",
    messagingSenderId: "278581705058",
    appId: "1:278581705058:web:7c42c0a297712da028143b"
  };
  
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)







/* = Functions - Firebase - Authentication = */
export function displayDate(firebaseDate) {
    // avoid date null error (while waiting for server to set date)
    if (!firebaseDate) {
        return "Date not available"
    }

    const date = firebaseDate.toDate()
    
    const day = date.getDate()
    const year = date.getFullYear()
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]

    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${day} ${month} ${year} - ${hours}:${minutes}`
}

export function authSignInWithGoogle() {
    
        signInWithPopup(auth, provider)
        .then((result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken;
          // The signed-in user info.
          const user = result.user;
          // IdP data available using getAdditionalUserInfo(result)
          // ...
          console.log('Signed in with Google')
        }).catch((error) => {
          // Handle Errors here.
          const errorCode = error.code;
          const errorMessage = error.message;
          // The email of the user's account used.
          const email = error.customData.email;
          // The AuthCredential type that was used.
          const credential = GoogleAuthProvider.credentialFromError(error);
          // ...
          console.error('Sign in with google failed, ', error)
        });
}

export function authSignInWithEmail() {
    const emailVal = emailInput.value
    const passVal = passInput.value

    signInWithEmailAndPassword(auth, emailVal, passVal)
    .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
       
        
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('error', error)
    });
}

export function authCreateAccountWithEmail() {
    const emailVal = emailInput.value
    const passVal = passInput.value

    createUserWithEmailAndPassword(auth, emailVal, passVal)
    .then((userCredential) => {
        // Signed up 
        const user = userCredential.user;
        
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('error', error)
    });
}

export function authSignOut() {
    signOut(auth).then(() => {
        clearAuthFields()
    }).catch((error) => {
        console.error('Sign out error: ', error)
    });
}
export function authUpdateProfile() {
    const newDisplayName = displayNameInputEl.value
    const newPhotoURL = photoURLInputEl.value

    updateProfile(auth.currentUser, {
        displayName: newDisplayName, photoURL: newPhotoURL
        }).then(() => {
        console.log("Profile updated!")
        }).catch((error) => {
        console.error('Updating the profile error: ',error)
        });
}
export async function addCardToDb(cardEng, cardChn, cardPin, cardText, user) {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            uid: user.uid,
            english: cardEng,
            chinese: cardChn,
            pinyin: cardPin,
            text: cardText,
            createdAt: serverTimestamp(),
            mood: moodState
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e.message);
        }

}

export async function updateCardInDB(docId, newMood) {
    const moodRef = doc(db,collectionName, docId)
    await updateDoc(moodRef, {
        mood: newMood
    })

}

export async function deleteCardFromDB(docId) {
    console.log(docId);
    await deleteDoc(doc(db, collectionName, docId));
}


export function fetchRealtimeCardsFromDB(query, user){
    onSnapshot(query, (querySnapshot) => {
        clearAllCards(allCardsEl)
        querySnapshot.forEach((doc)=> {
            renderCards(allCardsEl, doc)
        })
    })
}


export function fetchMoodPosts(user, mood) {
    const startOfDay = new Date()
    startOfDay.setHours(0,0,0,0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const cardRef = collection(db, collectionName)
    let q
    if (mood != 'all') {
        const moodNum = Number(mood)
        q = query(cardRef, where('uid', '==', user.uid), where('mood', '==', moodNum), orderBy('createdAt', 'desc'))
    }
    else {
        q = query(cardRef, where('uid', '==', user.uid), orderBy('createdAt', 'desc'))
    }

    fetchRealtimeCardsFromDB(q, user)
}
