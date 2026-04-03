import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Check, Clock, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';

const PRIMARY = '#123E7C';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const TEXT = '#101828';
const TEXT_SEC = '#6B7280';

export default function FinanceOverview() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      const allInvoices = await base44.entities.Invoice.list('-created_date', 500);
      setInvoices(allInvoices);

      // Process monthly data
      const monthlyStats = {};
      const currentYear = new Date().getFullYear();

      allInvoices.forEach(inv => {
        const date = new Date(inv.created_date);
        if (date.getFullYear() === currentYear) {
          const monthKey = date.toLocaleDateString('ar-SA', { month: 'short' });
          if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = { month: monthKey, paid: 0, pending: 0, total: 0 };
          }

          const amount = inv.total_amount || inv.amount || 0;
          if (inv.status === 'paid') {
            monthlyStats[monthKey].paid += amount;
          } else if (['pending', 'issued', 'overdue'].includes(inv.status)) {
            monthlyStats[monthKey].pending += amount;
          }
          monthlyStats[monthKey].total += amount;
        }
      });

      const monthlyArray = Object.values(monthlyStats).sort((a, b) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(a.month) - months.indexOf(b.month);
      });

      setMonthlyData(monthlyArray);

      // Process yearly data (last 12 months)
      const yearlyStats = {};
      const today = new Date();

      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = d.toLocaleDateString('ar-SA', { month: 'short' });
        yearlyStats[monthKey] = { month: monthKey, collected: 0, target: 100000 };
      }

      allInvoices.forEach(inv => {
        const date = new Date(inv.created_date);
        const monthKey = date.toLocaleDateString('ar-SA', { month: 'short' });
        
        if (yearlyStats[monthKey] && inv.status === 'paid') {
          yearlyStats[monthKey].collected += inv.total_amount || inv.amount || 0;
        }
      });

      setYearlyData(Object.values(yearlyStats));
      setLoading(false);
    } catch (error) {
      console.error('Error loading finance data:', error);
      setLoading(false);
    }
  };

  // Calculate statistics
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingInvoices = invoices.filter(i => ['pending', 'issued', 'overdue'].includes(i.status));
  const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);
  const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + (i.total_amount || i.amount || 0), 0);
  const totalAmount = totalRevenue + pendingRevenue;
  const collectionRate = totalAmount > 0 ? Math.round((totalRevenue / totalAmount) * 100) : 0;

  // Current month statistics
  const currentMonth = new Date();
  const currentMonthStr = currentMonth.toLocaleDateString('ar-SA', { month: 'short' });
  const currentMonthData = monthlyData.find(m => m.month === currentMonthStr);
  const currentMonthRevenue = currentMonthData?.paid || 0;
  const currentMonthPending = currentMonthData?.pending || 0;

  const stats = [
    { label: 'إجمالي المحصل', value: `${totalRevenue.toLocaleString()} ر.ق`, icon: DollarSign, color: SUCCESS, bg: '#F0FFF4' },
    { label: 'المعلق', value: `${pendingRevenue.toLocaleString()} ر.ق`, icon: Clock, color: WARNING, bg: '#FFF4E5' },
    { label: 'نسبة التحصيل', value: `${collectionRate}%`, icon: TrendingUp, color: PRIMARY, bg: '#EAF2FF' },
    { label: 'الفواتير المدفوعة', value: paidInvoices.length, icon: Check, color: SUCCESS, bg: '#F0FFF4' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 border"
              style={{ backgroundColor: stat.bg, borderColor: '#E7ECF3' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>{stat.label}</p>
              <p className="text-lg font-bold mt-1" style={{ color: stat.color }}>
                {typeof stat.value === 'number' ? stat.value : stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly Revenue Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-5 border shadow-card"
        style={{ borderColor: '#E7ECF3' }}
      >
        <h3 className="font-bold text-base mb-4" style={{ color: TEXT }}>الإيرادات الشهرية</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7ECF3" />
              <XAxis 
                dataKey="month" 
                stroke={TEXT_SEC}
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke={TEXT_SEC} style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: `1px solid #E7ECF3`, borderRadius: '8px' }}
                formatter={(value) => value.toLocaleString()}
              />
              <Legend />
              <Bar dataKey="paid" fill={SUCCESS} name="مدفوع" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill={WARNING} name="معلق" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: TEXT_SEC }}>لا توجد بيانات</p>
        )}
      </motion.div>

      {/* Invoice Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-5 border shadow-card"
          style={{ borderColor: '#E7ECF3' }}
        >
          <h3 className="font-bold text-base mb-4" style={{ color: TEXT }}>توزيع حالة الفواتير</h3>
          {paidInvoices.length > 0 || pendingInvoices.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'مدفوعة', value: paidInvoices.length, color: SUCCESS },
                      { name: 'معلقة', value: pendingInvoices.length, color: WARNING },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    <Cell fill={SUCCESS} />
                    <Cell fill={WARNING} />
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SUCCESS }} />
                  <span>مدفوعة: {paidInvoices.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: WARNING }} />
                  <span>معلقة: {pendingInvoices.length}</span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: TEXT_SEC }}>لا توجد فواتير</p>
          )}
        </motion.div>

        {/* Collection Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-5 border shadow-card"
          style={{ borderColor: '#E7ECF3' }}
        >
          <h3 className="font-bold text-base mb-4" style={{ color: TEXT }}>تطور التحصيل السنوي</h3>
          {yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={yearlyData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7ECF3" />
                <XAxis 
                  dataKey="month"
                  stroke={TEXT_SEC}
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke={TEXT_SEC} style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: `1px solid #E7ECF3`, borderRadius: '8px' }}
                  formatter={(value) => value.toLocaleString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke={SUCCESS}
                  strokeWidth={2}
                  dot={{ fill: SUCCESS, r: 4 }}
                  name="المحصل"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={PRIMARY}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="الهدف"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: TEXT_SEC }}>لا توجد بيانات</p>
          )}
        </motion.div>
      </div>

      {/* Current Month Summary */}
      {currentMonthData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 border"
          style={{ borderColor: '#D4E4F7' }}
        >
          <h3 className="font-bold text-base mb-4" style={{ color: PRIMARY }}>الشهر الحالي ({currentMonthStr})</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>المحصل</p>
              <p className="text-xl font-bold mt-1" style={{ color: SUCCESS }}>{currentMonthRevenue.toLocaleString()} ر.ق</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>المعلق</p>
              <p className="text-xl font-bold mt-1" style={{ color: WARNING }}>{currentMonthPending.toLocaleString()} ر.ق</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: TEXT_SEC }}>الإجمالي</p>
              <p className="text-xl font-bold mt-1" style={{ color: PRIMARY }}>
                {(currentMonthRevenue + currentMonthPending).toLocaleString()} ر.ق
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}