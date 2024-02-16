import * as UI from './functionUI.js'
import { toggleLoggedInView, toggleLoggedOutView } from './functionUI.js';


/* === Imports === */
import { initializeApp } from "firebase/app";
import { doc, getFirestore, collection, addDoc, Timestamp, serverTimestamp, getDoc, getDocs, onSnapshot, QuerySnapshot,  query, where, orderBy, updateDoc, deleteDoc} from "firebase/firestore";

// top nav 
export const topNav = document.getElementById('top-nav')



/* === Imports === */

import { getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile,
} from "firebase/auth";

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

// * === STATE === * //
export let currentWordId = {
    state: 0,
}
export let mood = {
    state: 0,
}

export let languageMode = {
    state: 'local'
}

export let studiedCards = {
    state: []
}

export let cardState = {
    english: true,
    chinese: false,
    pinyin: false,
    text: false,
}


if (auth.currentUser) {
    console.log('toggle logged in');
    toggleLoggedInView()
} else {
    console.log('toggle logged out');
    toggleLoggedOutView()
}

// * === Global Constance === * //
export const collectionName = 'cards'

// * == MAIN CODE == */
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        UI.toggleLoggedInView()
        UI.showProfilePicture(userProfilePictureEl, user)
        UI.updateFilterButtonStyle(allFilterButtonEl)
        fetchMoodPosts(user, 'all')
        console.log('Populate card');
        UI.populateCard()


    } else {
      UI.toggleLoggedOutView()
    }
  });



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
        console.log('sign in with google activated');
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
        let randomNum = Math.random()
        const docRef = await addDoc(collection(db, collectionName), {
            uid: user.uid,
            english: cardEng,
            chinese: cardChn,
            pinyin: cardPin,
            text: cardText,
            createdAt: serverTimestamp(),
            mood: mood.state,
            random: randomNum
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
    // const cardRef = collection(db, collectionName)
    // const q = query(cardRef, where('uid', '==', user.uid), orderBy('createdAt', 'desc'))
    onSnapshot(query, (querySnapshot) => {
        UI.clearAllCards(allCardsEl)
        querySnapshot.forEach((doc)=> {
            UI.renderCards(allCardsEl, doc)
        })
    })
}


export function fetchMoodPosts(user, mood) {
    // const startOfDay = new Date()
    // startOfDay.setHours(0,0,0,0)
    // const endOfDay = new Date()
    // endOfDay.setHours(23, 59, 59, 999)

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








/* == UI - Elements == */
let englishMode = false


const emailInput = document.getElementById('email-input')
const passInput = document.getElementById('password-input')
const registerButton = document.getElementById('register-btn')
const signInButton = document.getElementById('sign-in-btn')
const signOutButton = document.getElementById('sign-out-btn')
const signInGoogle = document.getElementById('google-btn')


// user
const userProfilePictureEl = document.getElementById('user-profile-picture')
const displayNameInputEl = document.getElementById("display-name-input")
const photoURLInputEl = document.getElementById("photo-url-input")
const updateProfileButtonEl = document.getElementById("update-profile-btn")

// fetch cards btn
// const fetchCardsBtn = document.getElementById('fetch-cards-btn')


// Card get all the elements
export let engEl = document.getElementById('english-el')
export let chnEl = document.getElementById('chinese-el')
export let pinEl = document.getElementById('pinyin-el')
export let exaEl = document.getElementById('text-el')
let createdAtEl = document.getElementById('created-at-el')
export let moodScoreEl = document.getElementById('mood-el')
export let allCardsEl = document.getElementById('all-cards')


// answer buttons
const toChinese = document.getElementById('to-chinese')
const toPinyin = document.getElementById('to-pinyin')
const toEnglish = document.getElementById('to-english')
const toExamples = document.getElementById('to-examples')
// correct/incorrect buttons
const correctBtn = document.getElementById('correct-btn')
const incorrectBtn = document.getElementById('incorrect-btn')
const changeBtn = document.getElementById('change-btn')
const skipBtn = document.getElementById('skip-btn')

// add new card 
export const addCardChnEl = document.getElementById('card-input-chn')
export const addCardEngEl = document.getElementById('card-input-eng')
export const addCardPinEl = document.getElementById('card-input-pin')
export const addCardTextEl = document.getElementById('card-input-text')

const addCardBtn = document.getElementById('add-card-btn')

// emoji
export const moodEmojiEls = document.getElementsByClassName("mood-emoji-btn")

// filter
export const allFilterButtonEl = document.getElementById("filter-mood-all")
export const filterButtonEls = document.getElementsByClassName("filter-btn")

// language filter display
export const lngFilterButtonEls = document.getElementsByClassName('lng-btn')




/* == UI - Event Listeners == */

for (let lngBtn of lngFilterButtonEls) {
    lngBtn.addEventListener('click', UI.adjustCardLanguage)
}

for (let moodEmojiEl of moodEmojiEls) {
    moodEmojiEl.addEventListener('click', UI.selectMood)
}

for (let filterButtonEl of filterButtonEls){
    filterButtonEl.addEventListener('click', UI.selectFilter)
}

addCardBtn.addEventListener('click', UI.addCardPressed)

updateProfileButtonEl.addEventListener("click", authUpdateProfile)

registerButton.addEventListener("click", ()=> {
    authCreateAccountWithEmail()
})

signInButton.addEventListener('click', ()=>{
    authSignInWithEmail()
})

signOutButton.addEventListener('click', ()=> {
    authSignOut()
    
})

signInGoogle.addEventListener('click', ()=> {
    authSignInWithGoogle()
})

skipBtn.addEventListener('click', ()=> {
   UI.populateCard()

})
toChinese.addEventListener('click', ()=> {
    UI.toggleVis(chnEl)   
})
toPinyin.addEventListener('click', ()=> {
    UI.toggleVis(pinEl)  
})
toEnglish.addEventListener('click', ()=> {
    UI.toggleVis(engEl)  
})
toExamples.addEventListener('click', ()=> {
    UI.toggleVis(exaEl)  
})
correctBtn.addEventListener('click', ()=> {
    UI.toggleMoodLevel(true)
    UI.populateCard()
})

incorrectBtn.addEventListener('click', ()=> {
    UI.toggleMoodLevel(false)
    UI.populateCard()
})















