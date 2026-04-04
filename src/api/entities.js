import { supabase } from '@/lib/supabase';

// Generic CRUD wrapper that mimics Base44 SDK entity interface
function createEntity(tableName) {
  return {
    async list(filtersOrOrder, limitArg) {
      // Support both: list({ filter, order, limit }) and list("-created_at", 50)
      let filters = {};
      if (typeof filtersOrOrder === 'string') {
        filters = { order: filtersOrOrder, limit: limitArg };
      } else if (filtersOrOrder && typeof filtersOrOrder === 'object') {
        filters = filtersOrOrder;
      }

      let query = supabase.from(tableName).select('*');
      
      if (filters.filter) {
        Object.entries(filters.filter).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else {
            query = query.eq(key, value);
          }
        });
      }
      
      if (filters.order) {
        const desc = filters.order.startsWith('-');
        let col = desc ? filters.order.slice(1) : filters.order;
        // Map Base44 column names to Supabase
        const colMap = { 'created_date': 'created_at', 'updated_date': 'updated_at', 'date': 'created_at', 'deadline': 'due_date' };
        col = colMap[col] || col;
        query = query.order(col, { ascending: !desc });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      
      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },

    async create(record) {
      const { data: { user } } = await supabase.auth.getUser();
      const toInsert = { ...record };
      if (user) toInsert.created_by = user.id;
      
      const { data, error } = await supabase.from(tableName).insert(toInsert).select().single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // Base44 compatibility: filter(filterObj, order, limit)
    async filter(filterObj, order, limit) {
      return this.list({ filter: filterObj, order, limit });
    },

    // Realtime subscription (mimics Base44 subscribe)
    subscribe(callback) {
      const channel = supabase
        .channel(`${tableName}_changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
          callback({ type: payload.eventType, record: payload.new || payload.old });
        })
        .subscribe();

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

// All entities matching Base44 SDK names
export const Case = createEntity('cases');
export const Client = createEntity('clients');
export const Hearing = createEntity('hearings');
export const Invoice = createEntity('invoices');
export const CaseDocument = createEntity('case_documents');
export const CaseTask = createEntity('case_tasks');
export const ChatMessage = createEntity('chat_messages');
export const Conversation = createEntity('conversations');
export const Expense = createEntity('expenses');
export const FollowUp = createEntity('follow_ups');
export const HearingRequest = createEntity('hearing_requests');
export const Meeting = createEntity('meetings');
export const Notification = createEntity('notifications');
export const Party = createEntity('parties');
export const ServiceRequest = createEntity('service_requests');
export const SignatureRequest = createEntity('signature_requests');
export const DeviceToken = createEntity('device_tokens');

// Storage helpers
export const storage = {
  async uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData?.publicUrl || path;
  },

  async getFileUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl;
  },

  async deleteFile(bucket, path) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  },
};
