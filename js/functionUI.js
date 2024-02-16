// import * as FB from './firebase'
import * as JS from './index.js'
import { mood, auth, db, collectionName } from './index.js'
import { doc, getFirestore, collection, addDoc, Timestamp, serverTimestamp, getDoc, getDocs, onSnapshot, QuerySnapshot,  query, where, orderBy, updateDoc, deleteDoc, getCountFromServer, setDoc, limit} from "firebase/firestore";


// Signin element
const viewLoggedIn = document.getElementById('logged-in-view')
const viewLoggedOut = document.getElementById('logged-out-view')

// == * Logged In Views
// Click Add New Card
const studyCardEl = document.getElementById('study-card-view')
const addCardViewEl = document.getElementById('add-card-view')
const updateProfileViewEl = document.getElementById('update-profile-view')
const allCardsViewEl = document.getElementById('all-cards-view')
const cardViewsBtn = document.querySelectorAll('.card-view')




const viewMappings = {
    'study-card-view-btn': {
        element: studyCardEl,
        defaultClass: 'flex'
    },
    'add-card-view-btn': {
        element: addCardViewEl,
        defaultClass: 'flex'
    },
    'update-profile-view-btn':{
        element: updateProfileViewEl,
        defaultClass: 'flex'
    },
    'all-cards-view-btn': {
        element: allCardsViewEl,
        defaultClass:'flex'
    }
}




// * == EVENT LISTENERS * == //
cardViewsBtn.forEach(viewBtn => {
    viewBtn.addEventListener('click', toggleCardView)
})




// /* == Functions - UI Functions == */


function toggleCardView(event) {
    // hide all Views
    Object.values(viewMappings).forEach( ({ element}) => {
        element.classList.add('hidden')
        element.classList.remove('flex')
    });

    // get clicked view info
    const {element, defaultClass} = viewMappings[event.currentTarget.id]

    // show clicked
    if (element) {
        element.classList.remove('hidden')
        element.classList.add(defaultClass)
    }
}



export async function populateCard() {
    try {
        const word = await getRandomWord()

        const elementMapping = {
            english: JS.engEl,
            chinese: JS.chnEl,
            pinyin: JS.pinEl,
            text: JS.exaEl
        }

        Object.keys(JS.cardState).forEach(key => {
            const el = elementMapping[key]
            if (el) {
                if (JS.cardState[key]) {
                    el.classList.remove('hidden')
                } else {
                    el.classList.add('hidden')
                }
            }
        });

        // Updating content
        JS.chnEl.innerHTML = word.chinese;
        JS.engEl.innerHTML = word.english;
        JS.pinEl.innerHTML = word.pinyin;
        JS.exaEl.innerHTML = word.text
        // JS.moodScoreEl.innerHTML = `LEVEL: ${word.mood}`;

        // get div with star level
        JS.moodScoreEl.innerHTML = ''
        const starDiv = starRating(word.mood)
        JS.moodScoreEl.appendChild(starDiv)

        // append to moodScore

        // Set word id
        JS.currentWordId.state = word.id;

        // Add to studied cards
        JS.studiedCards.state.push(word.id);
    } catch (error) {
        console.error('Error fetching random card: ', error)
    }
}

function starRating(level) {

    // define an emtpy div tag 
    const starDiv = document.createElement('div')
    starDiv.id = 'star-div'
    starDiv.className = 'flex flex-row justify-center items-center'

    // for each level add a star image to the div tag
    for (let i = 0 ; i < level; i++) {
        const starImg = document.createElement('img')
        starImg.src = './assets/emojis/star.png'
        starImg.alt = 'star image'
        starImg.className = 'w-4 h-4'
        starDiv.appendChild(starImg)
    }
    // return div

    return starDiv
}

export function renderCards(postsEl, wholeDoc) {
    const postData = wholeDoc.data()
    let convertedDate = JS.displayDate(postData.createdAt)
    
    const cardDiv = document.createElement('div')
    cardDiv.id = 'each-cards'
    cardDiv.className = "each-cards bg-yellow-50 p-3 my-3 shadow-md"
    postsEl.appendChild(cardDiv)

    const topDiv = document.createElement('div')
    topDiv.className = "flex flex-row justify-between items-center mb-3"
    cardDiv.appendChild(topDiv)

        // ---* Remove Date *-- //
        // const dateP = document.createElement('p')
        // dateP.className = 'text-xs'
        // dateP.id = 'created-at-el'
        // dateP.innerHTML = convertedDate
        // topDiv.appendChild(dateP)

        const moodP = document.createElement('p')
        moodP.className = 'text-xs'
        moodP.id = "mood-score"
        moodP.innerHTML = `STAR LEVEL: ${postData.mood}`
        topDiv.appendChild(moodP)

        const editCardBtn = createPostUpdateButton(wholeDoc)
        topDiv.appendChild(editCardBtn)

        const deleteCardBtn = createDeleteButton(wholeDoc)
        topDiv.appendChild(deleteCardBtn)
    
    const bodyDiv = document.createElement('div')
    bodyDiv.className = "flex flex-row justify-around items-center "
    cardDiv.appendChild(bodyDiv)

        const englishP = document.createElement('p')
        englishP.id = 'english-el'
        englishP.className = "text-center"
        englishP.innerHTML = postData.english
        bodyDiv.appendChild(englishP)

        const chineseDiv = document.createElement('div')
        chineseDiv.className = "flex flex-col"
        bodyDiv.appendChild(chineseDiv)

            const chineseP = document.createElement('p')
            chineseP.id = "chinese-el"
            chineseP.innerHTML = postData.chinese
            chineseDiv.appendChild(chineseP)

            const pinyinP = document.createElement('p')
            pinyinP.id = 'pinyin-el'
            pinyinP.className = 'text-base font-light text-center'
            pinyinP.innerHTML = postData.pinyin
            chineseDiv.appendChild(pinyinP)
    
    const exSentences = document.createElement('p')
    exSentences.className = "border-t border-yellow-900 p-2 my-2"
    exSentences.innerHTML = replaceNewlinesWithBrTags(postData.text)
    cardDiv.appendChild(exSentences)
   
}

export function replaceNewlinesWithBrTags(inputString) {
    return inputString.replace(/\n/g, "<br>")
}

export function selectMood(event) {
    // find out id
    const selectedMoodEmojiElementId = event.currentTarget.id

    changeMoodStyleAfterSelection(selectedMoodEmojiElementId, JS.moodEmojiEls)
    const chosenMoodValue = returnMoodValueFromElementId(selectedMoodEmojiElementId)
    
    mood.state = chosenMoodValue
}

export function changeMoodsStyleAfterSelection(selectedMoodElementId, allMoodElements) {
    for (let moodEmojiEl of moodEmojiEls) {
        if (selectedMoodElementId === moodEmojiEl.id) {
            moodEmojiEl.classList.remove("unselected-emoji")          
            moodEmojiEl.classList.add("selected-emoji")
        } else {
            moodEmojiEl.classList.remove("selected-emoji")
            moodEmojiEl.classList.add("unselected-emoji")
        }
    }
}

export function addCardPressed() {
    const cardEng = JS.addCardEngEl.value
    const cardChn = JS.addCardChnEl.value
    const cardPin =JS. addCardPinEl.value
    const cardText = JS.addCardTextEl.value

    
    const user = auth.currentUser

    if (cardEng && mood.state) {
        JS.addCardToDb(cardEng, cardChn, cardPin, cardText, user)
        resetAllMoodElements(JS.moodEmojiEls)
        clearInputField(JS.addCardEngEl)
        clearInputField(JS.addCardChnEl)
        clearInputField(JS.addCardPinEl)
        clearInputField(JS.addCardTextEl)
    } else {
        console.error('Both textfield and mood need to be completed')
    }
}




export async function getRandomWord() {
    const cardsRef = collection(db, collectionName)
    let attempts = 0
    let maxAttempts = 10

    while (attempts <= maxAttempts) {
        const random = Math.random()
        const q = query(cardsRef, 
            where('random', '>=', random), 
            orderBy('random'),
            limit(1))
        const querySnapshot = await getDocs(q)

        // Check if any document is fetched and if it hasn't been studied yet
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]; // Assuming limit(1) ensures only one doc is fetched
            let randomCard = { id: doc.id, ...doc.data() };

            // Check if the fetched word is the same as the current word
            if (randomCard.id !== JS.currentWordId.state && !JS.studiedCards.state.includes(randomCard.id)) {
                return randomCard;
            }
        }
        attempts ++ 
    }

    // Try fetching from the start if the random value was too high and no documents were found or if the same word was fetched
    const newQuery = query(cardsRef, where("random", ">=", 0), orderBy("random"), limit(1));
    const newQuerySnapshot = await getDocs(newQuery);
    if (!newQuerySnapshot.empty) {
        const doc = newQuerySnapshot.docs[0];
        let newRandomCard = { id: doc.id, ...doc.data() };
        if (newRandomCard.id !== JS.currentWordId.state && !JS.studiedCards.state.includes(newRandomCard.id)) {
            return newRandomCard;
        }
    }

    // Fallback: If too many attempts or most cards are studied, fetch a broader set and filter client-side
    console.log('Switching to fallback strategy to find an unstudied card.');
    const allCardsQuery = query(cardsRef, orderBy('random'), limit(10)); // Adjust limit as needed
    const allCardsSnapshot = await getDocs(allCardsQuery);
    const unstudiedCards = allCardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                                .filter(card => !JS.studiedCards.state.includes(card.id));

    if (unstudiedCards.length > 0) {
        // Return the first unstudied card from the filtered list
        return unstudiedCards[0];
    } else {
        // No unstudied cards found, or potentially all cards have been studied
        console.error('No unstudied cards available. Reseting studied Cards to 0');
        JS.studiedCards.state = []
        return null;
    }
    
}



export function adjustCardLanguage(event) {
    let lngState = event.target.id
    JS.cardState[lngState] ? JS.cardState[lngState] = false : JS.cardState[lngState] = true

    event.target.classList.toggle('lng-btn-down');
    event.target.classList.toggle('lng-btn');
  
}

export function toggleVis(element) {
    element.classList.toggle('hidden')
}

export function toggleLoggedOutView() {
    viewLoggedOut.classList.remove("hidden")
    viewLoggedOut.classList.add("block")
    viewLoggedIn.classList.add("hidden")
    viewLoggedIn.classList.remove("block")

    // hide top-nav
    // JS.topNav.classList.toggle('hidden')

    
}

export function toggleLoggedInView() {
    viewLoggedOut.classList.add("hidden")
    viewLoggedOut.classList.remove("block")
    viewLoggedIn.classList.add("block")
    viewLoggedIn.classList.remove("hidden")

    // show top-nav
    // JS.topNav.classList.toggle('hidden')
    
}

export function clearInputField(field) {
    field.value = ""
}

export function clearAuthFields() {
    clearInputField(emailInput)
    clearAuthFields(passInput)
}

export function showProfilePicture(imgElement, user) {
    
    if (user !== null) {
        // The user object has basic properties such as display name, email, etc.
        const displayName = user.displayName;
        const email = user.email;
        const photoURL = user.photoURL;
        const emailVerified = user.emailVerified;
        
        if (photoURL) {
            imgElement.src = photoURL
        }
        
        const uid = user.uid;
        }
}

export function resetAllMoodElements(allMoodElements) {
    for (let moodEmojiEl of allMoodElements) {
        moodEmojiEl.classList.remove("selected-emoji-btn")
        moodEmojiEl.classList.remove("non-selected-emoji-btn")
    }
    
    mood.state = 0
}

export function returnMoodValueFromElementId(elementId) {
    return Number(elementId.slice(5))
}

export function changeMoodStyleAfterSelection(emojiElementId, moodEmojiEls){
    for (let emojiEl of moodEmojiEls ) {
        if (emojiEl.id === emojiElementId){
            emojiEl.classList.add('selected-emoji-btn')
            emojiEl.classList.remove('non-selected-emoji-btn')
        } else {
            emojiEl.classList.add('non-selected-emoji-btn')
            emojiEl.classList.remove('selected-emoji-btn')
        }
    }
}

export function clearAllCards(pageEl) {
    pageEl.innerHTML = ""
}

/* == Functions - UI Functions - Date Filters == */

export function resetAllFilterButtons(allFilterButtons) {
    for (let filterButtonEl of allFilterButtons) {
        filterButtonEl.classList.remove('selected-filter-btn')
    }
}

export function updateFilterButtonStyle(element) {
    element.classList.add('selected-filter-btn')
}

export function selectFilter(event) {
    const user = auth.currentUser
    const selectedFilterElementId = event.target.id
    const selectedFilterPeriod = selectedFilterElementId.split("-")[2]

    const selectedFilterElement = document.getElementById(selectedFilterElementId)
    resetAllFilterButtons(JS.filterButtonEls)
    updateFilterButtonStyle(selectedFilterElement)

    JS.fetchMoodPosts(user, selectedFilterPeriod)
}

export function createPostUpdateButton(wholeDoc) {
    const cardId = wholeDoc.id
    const cardData = wholeDoc.data()
    const button = document.createElement('button')

    button.className = 'text-xs p-1 bg-yellow-100 hover:bg-yellow-200'
    button.textContent = 'EDIT'
    button.addEventListener('click', ()=> {
        const newMood = prompt('Update the confidence: ', cardData.mood)

        if (newMood) {
            JS.updateCardInDB(cardId, newMood)
        }
    })
    return button
}

export function createDeleteButton(wholeDoc) {
    const cardId = wholeDoc.id
    const button = document.createElement('button')

    button.textContent = 'DELETE'
    button.className = 'text-xs p-1 bg-red-100 hover:bg-red-200'
    button.addEventListener('click', ()=> {
        JS.deleteCardFromDB(cardId)
    })

    return button
}

export async function toggleMoodLevel(result) {
    const wordID = JS.currentWordId.state;
    // Correctly reference a document within a collection
    const wordRef = doc(db, collectionName, wordID);

    const docSnap = await getDoc(wordRef);

    if(docSnap.exists()){
        let newMoodLevel;
        if (result){
            newMoodLevel = docSnap.data().mood + 1
            newMoodLevel = newMoodLevel > 5 ? 5 : newMoodLevel
        } else {
            newMoodLevel = docSnap.data().mood - 1
            newMoodLevel = newMoodLevel < 1 ? 1 : newMoodLevel
        }
        
        await updateDoc(wordRef, {
            mood: newMoodLevel
        })
        console.log('new mood level: ', newMoodLevel);
    } else {
        console.error('No such word exists (no ID match)');
    }
}