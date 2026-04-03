export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <div className="py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#123E7C" }}>سياسة الخصوصية</h1>
        
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>1. مقدمة</h2>
            <p>تحافظ منصة الاتفاق للمحاماة على سرية وأمان بيانات المستخدمين. تشرح هذه السياسة كيف نجمع ونستخدم ونحمي المعلومات الشخصية.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>2. البيانات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>معلومات الملف الشخصي (الاسم، البريد الإلكتروني، رقم الهاتف)</li>
              <li>تفاصيل القضايا والملفات القانونية</li>
              <li>المستندات والمرفقات المرفوعة</li>
              <li>سجلات المعاملات المالية</li>
              <li>سجلات الوصول والاستخدام</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>3. استخدام البيانات</h2>
            <p>نستخدم البيانات لـ:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>توفير خدمات إدارة القضايا القانونية</li>
              <li>معالجة الدفع والفواتير</li>
              <li>الاتصال بخصوص التحديثات المهمة</li>
              <li>تحسين الخدمة والأمان</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>4. الأمان</h2>
            <p>نستخدم التشفير وأفضل الممارسات الأمنية لحماية بيانات المستخدمين. جميع الاتصالات محمية بـ SSL/TLS.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>5. حقوق المستخدم</h2>
            <p>للمستخدمين الحق في الوصول وتصحيح وحذف بيانتهم الشخصية. يمكنهم التواصل معنا للطلب.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>6. التغييرات على السياسة</h2>
            <p>قد نحدّث هذه السياسة من وقت لآخر. سيتم إخطار المستخدمين بأي تغييرات جوهرية.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>7. التواصل</h2>
            <p>للأسئلة حول هذه السياسة، يرجى التواصل معنا عبر البريد الإلكتروني أو من خلال التطبيق.</p>
          </section>

          <p className="text-xs mt-8 pt-6 border-t" style={{ borderColor: "#E7ECF3", color: "#9CA3AF" }}>
            آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>
    </div>
  );
}