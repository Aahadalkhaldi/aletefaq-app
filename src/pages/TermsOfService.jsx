export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <div className="py-12">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#123E7C" }}>شروط الخدمة</h1>
        
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>1. القبول بالشروط</h2>
            <p>باستخدام تطبيق الاتفاق للمحاماة، يوافق المستخدم على جميع الشروط والأحكام المذكورة هنا.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>2. الخدمات</h2>
            <p>تقدم الخدمة أدوات لإدارة الملفات والقضايا القانونية والتواصل مع المحامين والعملاء.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>3. حساب المستخدم</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>المستخدم مسؤول عن سرية بيانات حسابه</li>
              <li>يجب عدم مشاركة بيانات الدخول مع الآخرين</li>
              <li>المستخدم مسؤول عن جميع الأنشطة على حسابه</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>4. السلوك المسموح</h2>
            <p>يجب على المستخدمين:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>احترام القوانين واللوائح</li>
              <li>عدم استخدام الخدمة لأغراض غير قانونية</li>
              <li>عدم إساءة استخدام بيانات المستخدمين الآخرين</li>
              <li>عدم محاولة اختراق نظام الأمان</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>5. المسؤولية والتعويضات</h2>
            <p>لا تتحمل الخدمة مسؤولية عن الخسائر الناشئة عن استخدام التطبيق أو عدم القدرة على استخدامه.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>6. المحتوى</h2>
            <p>المستخدم يحتفظ بملكية محتواه. بإرفاق المحتوى، يمنح المستخدم الخدمة حق استخدامه لتوفير الخدمة.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>7. إنهاء الخدمة</h2>
            <p>يمكن للمستخدم إنهاء حسابه في أي وقت. يمكن للخدمة إنهاء الحساب إذا انتهك المستخدم هذه الشروط.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>8. التغييرات</h2>
            <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بالتغييرات الجوهرية.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "#101828" }}>9. القانون الحاكم</h2>
            <p>تخضع هذه الشروط للقوانين السارية في الدولة.</p>
          </section>

          <p className="text-xs mt-8 pt-6 border-t" style={{ borderColor: "#E7ECF3", color: "#9CA3AF" }}>
            آخر تحديث: {new Date().toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>
    </div>
  );
}