import { useState, useEffect } from "react";
import { contactsApi, Contact } from "../../../api/client";

export type ContactForm = {
  name: string;
  phone: string;
  tags: string;
  notes: string;
};
export const EMPTY_FORM: ContactForm = {
  name: "",
  phone: "",
  tags: "",
  notes: "",
};

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await contactsApi.list();
    if (res.data) setContacts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const parseTags = (raw: string) =>
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const create = async (form: ContactForm) => {
    const res = await contactsApi.create({
      name: form.name,
      phone: form.phone,
      tags: parseTags(form.tags),
      notes: form.notes || undefined,
    });
    if (res.success) await load();
    return res;
  };

  const update = async (id: string, form: ContactForm) => {
    const res = await contactsApi.update(id, {
      name: form.name,
      phone: form.phone,
      tags: parseTags(form.tags),
      notes: form.notes || undefined,
    });
    if (res.success) await load();
    return res;
  };

  const remove = async (id: string) => {
    await contactsApi.delete(id);
    await load();
  };

  const exportContacts = async (format: "csv" | "json") => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:3000/export/contacts?format=${format}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allTags = [...new Set(contacts.flatMap((c) => c.tags))].sort();

  return {
    contacts,
    loading,
    load,
    create,
    update,
    remove,
    exportContacts,
    allTags,
  };
}
