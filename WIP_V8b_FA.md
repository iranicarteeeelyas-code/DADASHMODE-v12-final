# داداش‌مود V8.0-b · نسخهٔ نیمه‌کاره (نقطهٔ ذخیره)
این بسته همان V8.0-a است + پایهٔ موتور موشن‌گرافیک پخش. فایل‌های جدید هنوز در index.html بارگذاری نشده‌اند، پس رفتار اپ دقیقاً مثل V8.0-a است و چیزی خراب نمی‌شود.

## انجام‌شده (js/bmg/)
- bmg-core.js: توکن‌های مرکزی حرکت (مدت، ایزینگ، فنر، استگر، بلور، سایه، مقیاس، تأکید)، کتابخانهٔ کامل ایزینگ (cubic-bezier، steps، back، elastic، bounce، anticipate، settle، spring جرم-فنر-میراگر)، ساعت جدای PGM/PVW، تایم‌لاین کامل (play/pause/resume/reverse/seek/progress/cancel/kill/restart/timeScale/label/تودرتو/stagger/spring/sim)، باس رویداد با ادغام رویدادهای پشت‌سرهم، Pool، مانیتور فریم و افت کیفیت ۳ مرحله‌ای، حرکت کاهش‌یافته. با Node تست شد.
- bmg-draw.js: رندرر Canvas2D (همان بومی که ضبط می‌شود)، تایپوگرافی حرکتی فارسی بدون شکستن اتصال حروف (نمایش برشی)، کشیده به‌جای letter-spacing، انیمیشن وزن فونت متغیر، odometer رقم‌به‌رقم، اسلات، فلیپ، اسکرمبل، پنل شیشه‌ای، light sweep، حلقهٔ ضربه، اشعه، استریک، فلر، گرین، اسکن‌لاین، هولوگرام، RGB split، گلیچ، موشن‌بلور، کش لایه‌ها، محدودهٔ امن، ثبت رندررها.
- bmg-gpu.js: لایهٔ WebGL2 دوبعدی با instancing (ذرات بدون ساخت/حذف در هر فریم، حرکت تحلیلی در شیدر)، کنفتی، توپ کنفتی، جرقه، ستاره، غبار، دود، سکه، استریک، میدان انرژی واکنشی به صدا/داده، وایپ نویزی و دایره‌ای، جایگزین Canvas2D.

## باقی‌مانده (به ترتیب)
1. bmg-templates.js (حدود ۳۰ قالب پایه که همهٔ اسم‌های بخش ۴ سند را پوشش می‌دهند) + ۴۰ پریست بخش ۱۲.
2. bmg-engine.js: نمونه‌ها، ماشین حالت (idle→preroll→entering→live→updating→emphasis/alert→exiting→hidden)، PVW/PGM، API (showGraphic/updateGraphic/hideGraphic/takeLive/previewGraphic/interruptGraphic/queueGraphic/setGraphicState/trigger)، ران‌داون، اولویت، صف، rollback، اتصال داده. نقطهٔ اتصال: در js/v7-gfx.js بین frame() و V7SUB.render.
3. bmg-3d.js با three r185 (MIT، از node_modules با esbuild بسته شود) و متن سه‌بعدی فارسی (marching squares → ExtrudeGeometry با bevel).
4. bmg-bridge.js (امتیاز، تایمر، حالت‌های V7 → گرافیک؛ HUD قدیمی با یک کلید برگردد) + bmg-studio.js (تب «استودیو گرافیک پخش» = انیمیشن‌ساز جدید).
5. ✅ v8-ml.js (V8.0-c) · ✅ v8-games.js (V8.0-d) · ✅ رفع ایرادهای قانون (V8.0-e، CHANGELOG_V8e_FA.md): پرامپت‌ساز، ورود/خروج .ml، گزارش بررسی، ساخت قسمت جدید. ✅ v8-games.js (V8.0-d): موتور بازی داده‌محور با ۴ حالت.
6. v8-cast.js: ۱۲ شخصیت/صدا برای نیلا (۹ زن، ۳ مرد) روی Gemini/OpenAI/دلارا، پیش‌شنود، کلید صدای جدا برای هر شخصیت.
7. حالت گوشی: هاب سرور با کلاینت Node تست شد و فرمان گوشی به کامپیوتر می‌رسد. مشکل واقعی: کلاینت میزبان در مرورگر و remote.html اصلاً وجود ندارند. نکته: روی http شبکهٔ محلی crypto.randomUUID نیست؛ از getRandomValues استفاده شود.
8. حذف js/broadcast-gfx.js و js/voice-system.js (بارگذاری نمی‌شوند و README آن‌ها ادعای نادرست دارد)، به‌روزرسانی sw.js، اسکریپت اجرای ویندوز، تست کامل در کرومیوم، زیپ نهایی.


## به‌روزرسانی V8.0-f
- ✅ موارد ۱ تا ۴ (قالب‌ها، موتور، سه‌بعدی، پل و استودیو) در V8.0-f ساخته شد (CHANGELOG_V8f_FA.md).
- ⏳ باقی‌مانده: حالت گوشی (remote.html + کلاینت میزبان)، ویرایش engine بازی‌های جدید در اپ، شخصیت‌های صدا، حذف voice-system.js، اسکریپت ویندوز.
