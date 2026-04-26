export const TAGLINES = [
  "Beta dekho, logic samjho — yaad mat karna",
  "Ek question galat hua? Koi baat nahi, practice karo",
  "Toppers bhi rote the — but they kept going",
  "Consistency > Intelligence — always",
  "Aaj ek chapter more, kal ek rank higher",
  "Error is just feedback, bro",
  "Sleep 7 hrs, study smart, crack karo",
  "Mehnat aaj, sukoon result ke din",
  "Haar mat maan, syllabus khatam hone wala hai",
  "Distraction chhod, selection pakka kar",
  "Focus bhai focus! Exam samne khada hai",
  "Maa-baap ke sapne — ek attempt baaki hai",
  "Social media band, mock tests chalu",
  "Ek aur PYQ laga le, pakka fada jayega",
  "Bhai stress mat le, revision pe dhyaan de",
  "Concept clear toh exam clear, seedhi baat",
  "Ranker log excuses nahi dete, output dete hain",
  "Darna kya hai jab MargDarshak AI sath hai?",
  "Chhote steps se hi badi rank aati hai"
]

export function getRandomTagline(): string {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)]
}

export const EMPTY_STATE_MESSAGES = {
  no_tests: "Bhai, ek bhi test nahi diya? Kaise chalega? Pehla mock test abhi shuru kar!",
  no_doubts: "Koi doubt nahi hai? Ya toh sab aata hai, ya kuch bhi nahi padha. Ask your first doubt now!",
  no_plan: "Plan ke bina padhai matlab bina map ke safar. Apna pehla AI study plan generate kar le.",
  no_analytics: "Data nahi hai analyse karne ke liye. Padhai shuru kar, test de, fir aake dekh apna progress!"
}

export const EXAM_TAGLINES: Record<string, string> = {
  'jee-main': "NIT wait kar raha hai, padh le",
  'jee-adv': "IIT ke darwaaze band nahi hue hain",
  'neet-ug': "Doctor banna hai? Toh padh le yaar",
  'upsc-cse': "3 saal ki mehnat, lifetime ka respect",
  'cat': "MBA, IIM, aur ek chai — possible hai",
  'ssc-cgl': "Inspector banna hai toh maths pe dhyan de",
  'bank-po': "Speed and accuracy — yehi game hai",
  'gate': "PSU ya MTech? Decision tera, mehnat bhi teri",
  'clat': "NLSIU ka sapna sach hoga, logical ban",
  'nda': "Fauj ka junoon hai toh subah jaldi uth",
  'cuet': "Top college chahiye toh domain subjects strong kar",
  'bitsat': "Pilani jana hai toh speed badha",
  'wbjee': "Jadavpur waiting list mein nahi, merit list mein aa",
  'mht-cet': "COEP ka rasta books se jata hai",
  'ca-found': "Balance sheet match hogi, pehle books khol",
  'ugc-net': "Professor sab, JRF clear karna hai ki nahi?",
  'rrb-ntpc': "Railway ki job chahiye toh G.K rataar maar",
  'ibps-clerk': "Banking me seat chahiye toh practice chalu rakh",
  'cds': "Officers' Training Academy wait kar rahi hai",
  'aiims-pg': "Super-specialty ka sapna, padhai se hi poora hoga",
}
