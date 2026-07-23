FROM apify/actor-node-playwright-chrome:22-1.52.0

# 1. نسخ كل الملفات مع نقل الملكية للمستخدم myuser لمنع مشاكل الصلاحيات
COPY --chown=myuser:myuser . ./

# 2. تثبيت الباقات
RUN npm install --include=dev

# 3. بناء مشروع التايب سكريبت
RUN npm run build

# 4. تشغيل الـ Actor
CMD ["npm", "start"]