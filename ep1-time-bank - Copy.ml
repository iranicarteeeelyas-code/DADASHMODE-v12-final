{
 "format": "dadashmode-ml/1",
 "season": "",
 "episode": null,
 "name": "داداش‌مود · بانک زمان · قسمت ۱ (کتاب V7)",
 "unit": "ثانیه",
 "startBank": 45,
 "players": [
  {
   "name": "اِلیاس",
   "color": "#ff2738",
   "symbol": "▲",
   "key": "a"
  },
  {
   "name": "عِماد",
   "color": "#00c98d",
   "symbol": "●",
   "key": "l"
  }
 ],
 "speakers": [
  {
   "id": "host",
   "name": "جمنای (داور · صدای پشتیبان اپ)",
   "provider": "gemini",
   "voice": "Leda"
  }
 ],
 "theme": {
  "font": "Lalezar",
  "name": "استودیو قرمز",
  "bg1": "#12060a",
  "bg2": "#4f0d1c",
  "accent": "#ff3b3b",
  "accent2": "#ffd23f",
  "ink": "#fff7ec",
  "shade": "#7a0f1f"
 },
 "brief": {
  "summary": "دوئل الیاس و عماد طبق کتاب کارگردانی V7: شروع ۴۵|۴۵ · برج لیوان · فاصله · دوئل ساندویچ · بانک باز شد · پازل چسبی و چالش چسب · رونمایی (سقف ۳۰) · فروشگاه ۵ کارت · شوت ریسک · گاوصندوق سه‌ایستگاهی · کیف سه‌لایه.",
  "tone": "جمنای داور خشک، منصف و کم‌حرف؛ هیچ عددی جز آنچه کارگردان از اپ می‌خواند نمی‌گوید. حین دوئل ساندویچ سکوت کامل.",
  "characters": [
   "اِلیاس · قرمز · E · کلید A",
   "عِماد · سبز · M · کلید L",
   "جمنای · داور هوش مصنوعی (بنفش) · اپ = منبع حقیقت اعداد"
  ],
  "beats": [
   "هوک و معرفی (۴۵|۴۵)",
   "راند ۱ تا ۴ + پیچش «بانک باز شد»",
   "رونمایی، فروشگاه کارت، شوت ریسک",
   "فینال گاوصندوق و کیف سه‌لایه"
  ],
  "directorNotes": [
   "اپ تنها منبع اعداد است؛ جمنای فقط تکرار می‌کند",
   "ایمنی دوئل ساندویچ: ناظر هایملیچ، کلمهٔ توقف «قرمز»",
   "رمز کیف قبل از REC در اپ مهر شود"
  ]
 },
 "flow": [
  "READY",
  "R1",
  "R2",
  "R3_SANDWICH",
  "TWIST_BANKOPEN",
  "R4_GLUE",
  "REVEAL",
  "SHOP",
  "RISK",
  "VAULT",
  "CASE",
  "END"
 ],
 "rules": {},
 "intros": {},
 "stateNames": {},
 "lists": {
  "targets": [
   {
    "name": "دوچرخه",
    "accept": [
     "دوچرخه",
     "بایسیکل",
     "دوچرخه‌سواری"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "ماهی",
    "accept": [
     "ماهی"
    ],
    "note": "نهنگ کوچک نه",
    "callback": false
   },
   {
    "name": "خانه",
    "accept": [
     "خانه",
     "خونه",
     "ساختمان"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "عینک",
    "accept": [
     "عینک"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "ساعت",
    "accept": [
     "ساعت"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "چتر",
    "accept": [
     "چتر"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "فنجان",
    "accept": [
     "فنجان",
     "لیوان",
     "ماگ"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "خورشید",
    "accept": [
     "خورشید",
     "آفتاب"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "ماشین",
    "accept": [
     "ماشین",
     "خودرو"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "درخت",
    "accept": [
     "درخت"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "کلید",
    "accept": [
     "کلید"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "قلب",
    "accept": [
     "قلب"
    ],
    "note": "",
    "callback": false
   },
   {
    "name": "ساندویچ",
    "accept": [
     "ساندویچ",
     "همبرگر",
     "نون"
    ],
    "note": "کال‌بک راند ۳",
    "callback": true
   },
   {
    "name": "تاج",
    "accept": [
     "تاج",
     "کلاه پادشاه"
    ],
    "note": "",
    "callback": true
   },
   {
    "name": "دستکش",
    "accept": [
     "دستکش",
     "دستکش بوکس"
    ],
    "note": "",
    "callback": true
   },
   {
    "name": "گرگ",
    "accept": [
     "گرگ",
     "سگ"
    ],
    "note": "لوگوی کانال",
    "callback": true
   }
  ],
  "riddles": [
   {
    "answer": 0,
    "normal": "الیاس ۵ تا ساندویچ داشت. هر ۵ تا رو داد به عماد. عماد پرسید «بقیه‌ش کو؟». چند تا ساندویچ برای الیاس مونده؟",
    "spicy": "یه خروس روی نوک شیروونی تخم می‌ذاره. چند تا تخم‌مرغ از سمت چپ پایین می‌غلته؟",
    "hint": "خروس… تخم؟ جدی؟"
   },
   {
    "answer": 1,
    "normal": "کدوم عدد از ۱ تا ۹ هر چی در خودش ضرب بشه، باز همون‌قدر لوس می‌مونه؟",
    "spicy": "اینترنت خونه ۱۰ مگه. نصفش رو همسایه می‌دزده، از بقیه ۴ مگ رو آپدیت خودکار گوشی می‌خوره. چند مگ برای ما می‌مونه؟",
    "hint": "اول نصف کن، بعد کم کن."
   },
   {
    "answer": 2,
    "normal": "چند تا داداش پشت این میزن که هر دوشون مطمئنن از اون یکی باهوش‌ترن؟",
    "spicy": "یه ساندویچ رو نصف کردیم، هر نصفه رو دوباره نصف کردیم، بعد عماد نصف تیکه‌ها رو خورد. چند تیکه موند؟",
    "hint": "اول تیکه‌ها رو بشمار، بعد نصف."
   },
   {
    "answer": 3,
    "normal": "یه مثلث چند تا ضلع داره، وقتی هیچ‌کس روش نشسته؟",
    "spicy": "من یه عددم. دو برابرم کنی و ۴ تا اضافه کنی، می‌شم ۱۰. من کی‌ام؟",
    "hint": "از ۱۰ برعکس برگرد."
   },
   {
    "answer": 4,
    "normal": "یه گربه چند تا پا داره، وقتی داره وانمود می‌کنه صدات رو نمی‌شنوه؟",
    "spicy": "اگه پس‌فردا پنج‌شنبه باشه، امروز چندمین روز هفته‌ست؟ (شنبه = ۱)",
    "hint": "از پنج‌شنبه دو روز برگرد."
   },
   {
    "answer": 5,
    "normal": "یه دست چند تا انگشت داره… منهای انگشتی که عماد باهاش «رد کردن تبلیغ» رو می‌زنه، به‌علاوهٔ همون انگشت؟",
    "spicy": "من یه عددم. ضرب در ۳ بشم و ۵ تا کم کنم، می‌شم ۱۰. من کی‌ام؟",
    "hint": "۱۰ به‌علاوهٔ ۵، تقسیم بر ۳."
   },
   {
    "answer": 6,
    "normal": "بزرگ‌ترین عدد تاس، همونی که هیچ‌وقت وقتی الیاس لازمش داره نمیاد؟",
    "spicy": "عنکبوت ۸ پا داره. مورچه ۲ پا کمتر داره. مورچه چند پا داره؟",
    "hint": "هشت منهای دو."
   },
   {
    "answer": 7,
    "normal": "هفته چند روزه، اگه عماد هر روزش بگه «از فردا رژیم»؟",
    "spicy": "۲ + ۲ × ۲ … به‌علاوهٔ یه بار ضایع شدن عماد (= ۱). جواب؟",
    "hint": "اول ضرب، بعد جمع. (بحث ترند اینترنت!)"
   },
   {
    "answer": 8,
    "normal": "یه هشت‌پا چند تا دست داره، وقتی بهش بگی ظرفا رو بشوره؟ (هنوز همون‌قدر)",
    "spicy": "۸ نفر، ۸ لیوان رو در ۸ ثانیه برج می‌کنن. ۱ نفر، ۱ لیوان رو در چند ثانیه برج می‌کنه؟",
    "hint": "هر نفر یه لیوان، هم‌زمان."
   },
   {
    "answer": 9,
    "normal": "بزرگ‌ترین عدد یک‌رقمی چنده؟ نه… «نه» جواب نیست. یا هست؟",
    "spicy": "۱۰ تا ساندویچ داشتی. داداشت همه رو خورد به‌جز ۹ تا. چند تا برات موند؟",
    "hint": "«به‌جز» رو دوباره بخون."
   }
  ],
  "envelopes": [
   {
    "title": "حق وتو",
    "desc": "برنده بازی اول قسمت بعد را انتخاب می‌کند",
    "scoreEffect": false
   },
   {
    "title": "کارت هدیه",
    "desc": "یک کارت آبی رایگان در فروشگاه قسمت بعد",
    "scoreEffect": true
   },
   {
    "title": "استارت ۵۰",
    "desc": "قسمت بعد با ۵۰ به‌جای ۴۵ شروع می‌کند",
    "scoreEffect": true
   },
   {
    "title": "تامنیل",
    "desc": "برنده عکس بامزهٔ بازنده را برای تامنیل بعدی انتخاب می‌کند (از بین ۳ عکس محترمانه)",
    "scoreEffect": false
   },
   {
    "title": "جملهٔ جمنای",
    "desc": "برنده یک جمله می‌نویسد که جمنای قسمت بعد به بازنده می‌گوید",
    "scoreEffect": false
   },
   {
    "title": "دستیار یک‌روزه",
    "desc": "بازنده یک روز کارهای کوچک برنده را انجام می‌دهد (شورتس جدا)",
    "scoreEffect": false
   },
   {
    "title": "شام انتخابی",
    "desc": "برنده شام را انتخاب می‌کند، بازنده آماده می‌کند",
    "scoreEffect": false
   },
   {
    "title": "ریموت هفته",
    "desc": "کنترل تلویزیون یا صندلی جلوی ماشین برای یک هفته",
    "scoreEffect": false
   },
   {
    "title": "اسم قسمت",
    "desc": "برنده عنوان قسمت بعد را انتخاب می‌کند",
    "scoreEffect": false
   },
   {
    "title": "ویدیوی تعریف",
    "desc": "بازنده ۱۰ ثانیه با لحن جدی از برنده تعریف می‌کند (شورتس)",
    "scoreEffect": false
   },
   {
    "title": "پاکت دوبل",
    "desc": "امروز هیچ؛ قسمت بعد دو پاکت در کیف (غافلگیری منفیِ بامزه)",
    "scoreEffect": false
   },
   {
    "title": "جابه‌جایی",
    "desc": "برنده می‌تواند مجازات بازنده را با یک گزینهٔ دیگر از کامنت‌ها عوض کند",
    "scoreEffect": false
   }
  ],
  "bites": [
   {
    "emoji": "🧇",
    "title": "ویفر شیرین",
    "react": "آرامش قبل از طوفان",
    "mild": true
   },
   {
    "emoji": "🍋",
    "title": "قاچ کوچک لیمو",
    "react": "ترشی و چشم بسته",
    "mild": false
   },
   {
    "emoji": "🌶",
    "title": "لقمه نان + کمی سس تند معمولی",
    "react": "تندی کنترل‌شده",
    "mild": false
   },
   {
    "emoji": "🥒",
    "title": "خیارشور",
    "react": "شوری",
    "mild": false
   },
   {
    "emoji": "🫒",
    "title": "زیتون",
    "react": "مزهٔ متفاوت",
    "mild": false
   },
   {
    "emoji": "🍪",
    "title": "بیسکویت خوش‌شانس",
    "react": "کنتراست",
    "mild": true
   }
  ]
 },
 "segments": [
  {
   "type": "title",
   "game": "generic",
   "title": "داداش‌مود",
   "subtitle": "بانک زمان · هوک",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "هوک ۰۰:۰۰–۰۰:۳۰ · تایمر نارنجی ۰۰:۰۸ تا صفر + تیک‌تاک · فلش‌فوروارد نقاشی کور و شوت ریسک (بدون لو دادن نتیجه) · ثانیهٔ ۱۳ الیاس: «هر بازی رو ببریم، برای آخر ویدیو زمان می‌گیریم.» · عماد: «و آخرش… این جعبه مال منه.»",
   "v7": "READY",
   "lines": [
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "سه… دو…",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "و من داورم. پس تقلب ممنوع.",
     "direction": ""
    }
   ]
  },
  {
   "type": "bank",
   "game": "generic",
   "title": "بانک زمان",
   "subtitle": "هر نفر ۴۵ ثانیه",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "۳٫۲ معرفی و قانون · کارت قوانین اپ: سقف فاصله ۳۰ و کف ۲۰ دیده می‌شود ولی گفته نمی‌شود · الیاس: «قانون ساده‌ست: هر کدوم ۴۵ ثانیه داریم…»",
   "v7": "READY",
   "lines": [
    {
     "speaker": "host",
     "emotion": "warm",
     "text": "آماده‌ام. من فقط چیزی رو می‌گم که می‌بینم. و الیاس… دیدمت که داشتی می‌خندیدی.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "من طرف هیچ‌کس نیستم. طرف قانونم.",
     "direction": ""
    }
   ]
  },
  {
   "type": "intro",
   "game": "cup",
   "title": "برج لیوان با یک دست",
   "subtitle": "راند یک",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R1",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "راند یک. ده لیوان، فقط با یک دست. برج باید دو ثانیه سالم بمونه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "cup",
   "title": "قوانین برج لیوان",
   "subtitle": "",
   "rules": [
    "۱۰ لیوان · برج ۱-۲-۳-۴",
    "دست دیگر پشت کمر · دست دوم = خطا و از نو",
    "سقف ۳۰ ثانیه · هم‌زمان · افتادن = از نو",
    "برج باید ۲ ثانیه بعد از برداشتن دست سالم بماند",
    "اولین برج معتبر ۱۰+ · هیچ‌کس: طبقهٔ بیشتر ۵+"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R1",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "ده لیوان، برج یک، دو، سه، چهار.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "دست دوم پشت کمر. دست دوم بیاد، خطاست.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "سی ثانیه، هم‌زمان. ریخت؟ از نو.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "برج باید دو ثانیه سالم بمونه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "excited",
     "text": "اولین برج سالم، ده ثانیه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "countdown",
   "game": "generic",
   "title": "دست دوم پشت کمر · شروع!",
   "subtitle": "",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R1",
   "lines": []
  },
  {
   "type": "play",
   "game": "cup",
   "title": "برج لیوان",
   "subtitle": "راند یک",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "دکمهٔ «معتبر؟» شمارش ۲ ثانیه را شروع می‌کند (نه جمنای) · کلید: ۲/۱ معتبر · ۳/۴ ریخت",
   "v7": "R1",
   "lines": [
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "دست دوم!",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "برجت زلزله اومد یا خودت زلزله‌ای؟",
     "direction": ""
    }
   ]
  },
  {
   "type": "intro",
   "game": "distance",
   "title": "فاصله را خودت انتخاب کن",
   "subtitle": "راند دو",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R2",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "راند دو. خطت رو انتخاب کن. بعد از قفل، عوض نمی‌شه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "distance",
   "title": "قوانین پرتاب",
   "subtitle": "",
   "rules": [
    "خط ۲ متر ۵+ · ۳ متر ۱۰+ · ۴ متر ۲۰+",
    "یک بار انتخاب و قفل در اپ",
    "۳ پرتاب، نوبتی، نفر عقب اول",
    "اولین گل ارزش خط را می‌گیرد؛ بقیه صفر",
    "پا روی خط = پرتاب باطل (شمرده می‌شود)"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R2",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "سه خط: دو متر پنج، سه متر ده، چهار متر بیست ثانیه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "یک بار انتخاب می‌کنید و قفل می‌شه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "سه پرتاب، نوبتی. نفر عقب اول.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "excited",
     "text": "اولین گل، ارزش خط رو می‌گیره.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "پا روی خط، پرتاب باطل.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "distance",
   "title": "فاصله را خودت انتخاب کن",
   "subtitle": "راند دو",
   "rules": [],
   "duration": 60,
   "reward": 20,
   "notes": "ری‌هوک ۰۳:۰۰ · AI-CAM ۴۵ درجه به سمت سطل",
   "v7": "R2",
   "lines": [
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "انتخاب قفل شد.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "من باد رو نمی‌بینم. پرتابت رو دیدم.",
     "direction": ""
    }
   ]
  },
  {
   "type": "intro",
   "game": "sandwich",
   "title": "دوئل ساندویچ",
   "subtitle": "راند سه",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R3_SANDWICH",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "راند سه. دوئل ساندویچ. اوّلی که قورت بده، وقت می‌بره.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "sandwich",
   "title": "قوانین دوئل ساندویچ",
   "subtitle": "",
   "rules": [
    "دو ساندویچ یکسان · دست‌ها پشت کمر تا بوق",
    "سقف ۶۰ ثانیه · «دهان‌پر» = ساعت می‌ایستد (زرد، موقت)",
    "۳۰ ثانیه برای قورت + دهان خالی ۲ ثانیه به تروث‌کم",
    "برنده = اختلاف زمان (کف ۳+ · سقف ۲۰+) · زیر ۱ ثانیه: هر دو ۵+",
    "برگشت غذا = رد · تکهٔ بیرون بشقاب یا شروع زودتر = ۳ ثانیه جریمه",
    "کلمهٔ توقف «قرمز» · ایمنی بالاتر از برد"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R3_SANDWICH",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "دو ساندویچ یکسان. دست‌ها پشت کمر تا بوق.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "آخرین لقمه رفت تو دهن، دستا بالا.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "بعد سی ثانیه وقت دارید قورت بدید و دهن خالی نشون بدید.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "excited",
     "text": "برنده، اختلاف زمان رو می‌گیره. حداقل سه، حداکثر بیست ثانیه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "برگشت غذا یعنی رد.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "هر کس بگه «قرمز»، همه‌چی همون لحظه متوقف می‌شه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "countdown",
   "game": "generic",
   "title": "سه… دو… یک…",
   "subtitle": "",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "از بوق تا اولین «دهان خالی»: جمنای و کارگردان ساکت (قانون سکوت)",
   "v7": "R3_SANDWICH",
   "lines": []
  },
  {
   "type": "play",
   "game": "sandwich",
   "title": "دوئل ساندویچ",
   "subtitle": "راند سه",
   "rules": [],
   "duration": 60,
   "reward": 20,
   "notes": "کلیدها: ۹/۷ دهان‌پر · ۳/۱ دهان خالی ✔ · ۶/۴ جریمهٔ ۳ ثانیه · Enter تأیید نتیجه · ناظر هایملیچ کنار تروث‌کم · اورژانس ۱۱۵",
   "v7": "R3_SANDWICH",
   "lines": [
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "خالیه. مثل یخچال خونه‌ی دانشجویی.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "طبق قانون… رد. ساندویچ حقّ اعتراض نداره.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "استپ! اول قورت، بعد خنده.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "shop",
   "title": "بانک باز شد",
   "subtitle": "BANK OPEN · آبی برای خودت · قرمز برای حریف · طلایی برای شجاع‌ها",
   "rules": [],
   "duration": 30,
   "reward": 0,
   "notes": "پیچش میانی ۰۵:۲۰ · گلیچ طلایی + صدای قفل · ۵ کارت قفل ۶ ثانیه · زوم روی دستکش · هیچ عددی عوض نمی‌شود",
   "v7": "TWIST_BANKOPEN",
   "lines": [
    {
     "speaker": "host",
     "emotion": "shock",
     "text": "نه. بانک باز شد.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "از الان ثانیه‌ها پول هم هستن. بعد از راند چهار، فروشگاه کارت باز می‌شه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "آبی برای خودت. قرمز برای حریف. طلایی… برای شجاع‌ها.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "taunt",
     "text": "می‌تونی. ولی هر چی بخری، از ساعت فینالت کم می‌شه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "تو راند بعد باهاش آشنا می‌شید.",
     "direction": ""
    }
   ]
  },
  {
   "type": "intro",
   "game": "glue",
   "title": "دستکش، پازل و چسب",
   "subtitle": "راند چهار",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R4_GLUE",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "راند چهار. دستکش‌ها رو بپوشید. پازل لوگو، شیش تیکه. چیدن با دستکش، چسب بی دستکش. اوّلی که دکمه‌ی تمام رو بزنه، پونزده ثانیه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "glue",
   "title": "قوانین پازل چسبی",
   "subtitle": "",
   "rules": [
    "پازل ۶ تکهٔ لوگو (۳×۲) · چاپ سیاه‌وسفید",
    "فاز ۱: چیدن با دستکش",
    "فاز ۲: چسب بدون دستکش (وقتی هر ۶ تکه روی برگه است)",
    "فاز ۳: دکمهٔ «تمام» · غلط = لغو + ۵ ثانیه قفل",
    "سقف ۱۸۰ · اولین تمام معتبر ۱۵+ · هیچ‌کس: درست‌تر ۵+",
    "چالش چسب (یک بار، نفر دوم): موفق ۱۰/۵ · ناموفق ۵−"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "R4_GLUE",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "پازل لوگو، شیش تیکه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "اول با دستکش می‌چینید.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "دستکش فقط وقتی درمیاد که هر شیش تیکه روی برگه باشه. بعد چسب.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "دکمه‌ی تمام. اگه غلط باشه، لغو و پنج ثانیه قفل.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "excited",
     "text": "اوّلین تمام درست، پونزده ثانیه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "نفر دوم یک بار حق داره بگه: چالش!",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "glue",
   "title": "دستکش، پازل و چسب",
   "subtitle": "راند چهار",
   "rules": [],
   "duration": 180,
   "reward": 15,
   "notes": "کلیدها: ۲/۱ تمام · ۰ غلط · * چالش چسب",
   "v7": "R4_GLUE",
   "lines": [
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "سر گرگ برعکسه. ادامه بدید.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "یه تیکه هنوز رو میزه. دستکش برمی‌گرده.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "glue",
   "title": "چالش چسب",
   "subtitle": "تست تکان ← قاب ← تمیزی",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "۳ معیار ثابت: تست تکان (کارگردان + تروث‌کم) · قاب و تراز (جمنای) · تمیزی فقط اگر مساوی",
   "v7": "GLUE_CHALLENGE",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "تست تکان.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "تشخیص نمی‌دم.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "generic",
   "title": "رونمایی بانک",
   "subtitle": "سقف فاصله ۳۰",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "REVEAL",
   "lines": [
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "سی. دقیقاً روی مرز. قانون اعمال نمی‌شه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "shop",
   "title": "فروشگاه کارت و دردسر",
   "subtitle": "",
   "rules": [
    "🔍 ذره‌بین ۱۰ · آبی · یک بار کمک",
    "🛡 سپر ۵ · آبی · قرمز را خنثی می‌کند",
    "🥊 دستکش بوکس ۱۵ · قرمز · حافظه با دستکش",
    "🌶 معمای تند ۱۰ · قرمز · معمای سخت‌تر",
    "🪞 آینه ۲۰ · طلایی · قرمز برمی‌گردد",
    "حداکثر ۲ کارت · فقط ۱ قرمز · مالیات ۵ نفر جلو · کف ۲۰"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "SHOP",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "ذره‌بین، ده ثانیه. یک بار کمک.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "سپر، پنج ثانیه. قرمز رو خنثی می‌کنه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "taunt",
     "text": "دستکش بوکس، پونزده. حافظه با دستکش.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "taunt",
     "text": "معمای تند، ده. معمای سخت‌تر.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "آینه، بیست. قرمز برمی‌گرده.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "حداکثر دو کارت. فقط یکی قرمز. مخفی.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "shop",
   "title": "فروشگاه کارت",
   "subtitle": "خرید مخفی · نفر عقب اول",
   "rules": [],
   "duration": 60,
   "reward": 0,
   "notes": "کلیدها: ۴ تا ۸ کارت برای نفری که نوبت اوست · Enter ثبت/رونمایی",
   "v7": "SHOP",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "فروشگاه کارت باز شد. هر نفر حداکثر دو کارت. فقط یکی قرمز. مخفی.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "shop",
   "title": "رونمایی کارت‌ها",
   "subtitle": "آینه ← سپر ← اجرا",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "SHOP_REVEAL",
   "lines": [
    {
     "speaker": "host",
     "emotion": "shock",
     "text": "آینه! کارت برگشت به صاحبش.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "کارت قرمز سوخت. سپر فعال شد.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "risk",
   "title": "شوت ریسک",
   "subtitle": "",
   "rules": [
    "شرط علنی: ۰ / ۱۰ / ۲۰",
    "نفر عقب اول اعلام می‌کند",
    "«همه‌چی ۳۰» فقط برای نفر ۱۵+ ثانیه عقب",
    "خورد = + شرط · نخورد = − شرط",
    "بانک هرگز زیر ۲۰ نمی‌رود"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "RISK",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "شرط علنی: صفر، ده یا بیست.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "اول نفر عقب اعلام می‌کنه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "همه‌چی سی، فقط برای کسی که پونزده ثانیه عقبه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "excited",
     "text": "خورد، شرطت اضافه می‌شه. نخورد، کم می‌شه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "بانک هیچ‌وقت زیر بیست نمی‌ره.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "risk",
   "title": "شوت ریسک",
   "subtitle": "شرط علنی",
   "rules": [],
   "duration": 60,
   "reward": 0,
   "notes": "کلیدها: ۹/۶ الیاس خورد/نخورد · ۷/۴ عماد خورد/نخورد",
   "v7": "RISK",
   "lines": [
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "شوت ریسک. اوّل نفر عقب اعلام می‌کنه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "نخورد. دو سانت. دو سانت دردناک.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "vault",
   "title": "آماده‌سازی فینال",
   "subtitle": "داور نزدیک‌تر میاد",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "نفر دوم ایزوله ۱۵+ متر · رمز کیف قبل از REC مهر شود",
   "v7": "VAULT_ARMED",
   "lines": [
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "داور نزدیک‌تر میاد.",
     "direction": ""
    }
   ]
  },
  {
   "type": "rules",
   "game": "vault",
   "title": "قانون گاوصندوق",
   "subtitle": "",
   "rules": [
    "ساعت هر نفر = بانکش · اول نفر عقب، بعد جلو",
    "ایستگاه ۱: نقاشی کور ← کد C1",
    "ایستگاه ۲: اتاق حافظه، ۸ لیوان · اشتباه ۳− ← کد C2",
    "ایستگاه ۳: معمای خنده‌دار · غلط = ۵ ثانیه قفل ← کد C3",
    "کدها = رمز واقعی کیف · رمز غلط = ۵ ثانیه قفل",
    "بیشترین زمان باقی‌مانده برندهٔ کیف است"
   ],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "VAULT_ARMED",
   "lines": [
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "ساعت هر نفر، همون بانکشه. اول نفر عقب.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "calm",
     "text": "ایستگاه یک: نقاشی کور.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "serious",
     "text": "ایستگاه دو: اتاق حافظه. هشت لیوان.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "ایستگاه سه: یه معمای خنده‌دار.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "سه کد، همون رمز واقعی کیفه.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "epic",
     "text": "هر کی با زمان بیشتر باز کنه، کیف مال اونه.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "vault",
   "title": "فینال · دویدن اول",
   "subtitle": "نفر عقب",
   "rules": [],
   "duration": 120,
   "reward": 0,
   "notes": "",
   "v7": "RUN1",
   "lines": [
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "حافظه‌ت رفته مرخصی.",
     "direction": ""
    },
    {
     "speaker": "host",
     "emotion": "celebrate",
     "text": "مغزت روشن شد.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "vault",
   "title": "فینال · دویدن دوم",
   "subtitle": "نفر جلو",
   "rules": [],
   "duration": 120,
   "reward": 0,
   "notes": "",
   "v7": "RUN2",
   "lines": [
    {
     "speaker": "host",
     "emotion": "referee",
     "text": "نه. پنج ثانیه فکر کن.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "case",
   "title": "کیف طلایی",
   "subtitle": "رمز واقعی · رقم به رقم",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "CASE",
   "lines": [
    {
     "speaker": "host",
     "emotion": "suspense",
     "text": "برنده‌ی کیف…",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "case",
   "title": "لایهٔ ۱ · تاج داداش",
   "subtitle": "نشان ساندویچ طلایی",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "CASE_L1",
   "lines": [
    {
     "speaker": "host",
     "emotion": "celebrate",
     "text": "نشان ساندویچ طلایی. اوّلین نشان روی تاج.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "case",
   "title": "لایهٔ ۲ · پاکت سرنوشت",
   "subtitle": "۱۲ پاکت · هیچ‌کس ندیده",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "CASE_L2",
   "lines": [
    {
     "speaker": "host",
     "emotion": "whisper",
     "text": "پاکت‌ها رو هیچ‌کس ندیده. حتی من. و من همه چی رو می‌بینم.",
     "direction": ""
    }
   ]
  },
  {
   "type": "play",
   "game": "case",
   "title": "لایهٔ ۳ · پاکت مجازات",
   "subtitle": "بازنده ۲ جعبه از ۶",
   "rules": [],
   "duration": 20,
   "reward": 0,
   "notes": "",
   "v7": "CASE_L3",
   "lines": [
    {
     "speaker": "host",
     "emotion": "playful",
     "text": "چون من داورم. و داور عاشق عدالته.",
     "direction": ""
    }
   ]
  },
  {
   "type": "winner",
   "game": "generic",
   "title": "دفاع از تاج",
   "subtitle": "قسمت بعد · مجازات با رأی کامنت‌ها",
   "rules": [],
   "duration": 30,
   "reward": 10,
   "notes": "",
   "v7": "END",
   "lines": [
    {
     "speaker": "host",
     "emotion": "epic",
     "text": "قسمت بعد… دفاع از تاج.",
     "direction": ""
    }
   ]
  }
 ]
}