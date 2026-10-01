// ============================================================
//  scheduleData.js — Orarul Facultății (date reale)
// ============================================================
//  CONVENȚII:
//  • group: "all" = ambele grupe | "A" = doar Grupa A | "B" = doar Grupa B
//  • week:  "all" = fiecare săptămână (fies) | "odd" = impară | "even" = pară
//  • type:  "curs" | "seminar" | "laborator" | "proiect"
// ============================================================

// Data de start a semestrului — Luni, Săptămâna 1 (impară)
const SEMESTER_START = new Date(2026, 8, 28); // 28 Septembrie 2026

const scheduleData = {

  // ═══════════════════════════════════════════════════════
  //  LUNI
  // ═══════════════════════════════════════════════════════
  monday: [
    {
      time: "08:00 – 10:00",
      subject: "Materiale și Structuri Inteligente",
      type: "curs",
      room: "K306",
      professor: "N.B.",
      group: "all",
      week: "all"
    },
    {
      time: "10:00 – 12:00",
      subject: "Senzori și Sisteme Senzoriale",
      type: "laborator",
      room: "G112",
      professor: "D.F.",
      group: "A",
      week: "odd"
    },
    {
      time: "10:00 – 12:00",
      subject: "Senzori și Sisteme Senzoriale",
      type: "laborator",
      room: "G112",
      professor: "D.F.",
      group: "B",
      week: "even"
    },
    {
      time: "12:00 – 14:00",
      subject: "Sisteme de Conducere în Robotică",
      type: "seminar",
      room: "G025",
      professor: "D.P.",
      group: "all",
      week: "even"
    },
    {
      time: "16:00 – 18:00",
      subject: "Materiale și Structuri Inteligente",
      type: "seminar",
      room: "G025",
      professor: "F.P.",
      group: "all",
      week: "odd"
    },
    {
      time: "18:00 – 20:00",
      subject: "Materiale și Structuri Inteligente",
      type: "laborator",
      room: "G025",
      professor: "F.P.",
      group: "B",
      week: "odd"
    },
    {
      time: "18:00 – 20:00",
      subject: "Materiale și Structuri Inteligente",
      type: "laborator",
      room: "G025",
      professor: "F.P.",
      group: "A",
      week: "even"
    }
  ],

  // ═══════════════════════════════════════════════════════
  //  MARȚI
  // ═══════════════════════════════════════════════════════
  tuesday: [
    {
      time: "08:00 – 10:00",
      subject: "Microcontrolere, Microprocesoare",
      type: "proiect",
      room: "G022",
      professor: "H.R.",
      group: "A",
      week: "odd"
    },
    {
      time: "08:00 – 10:00",
      subject: "Microcontrolere, Microprocesoare",
      type: "proiect",
      room: "G022",
      professor: "H.R.",
      group: "B",
      week: "even"
    },
    {
      time: "11:00 – 14:00",
      subject: "Automate și Microprogramare",
      type: "curs",
      room: "K301",
      professor: "D.P.",
      group: "all",
      week: "all"
    },
    {
      time: "17:00 – 20:00",
      subject: "Microcontrolere, Microprocesoare",
      type: "curs",
      room: "K305",
      professor: "H.R.",
      group: "all",
      week: "all"
    }
  ],

  // ═══════════════════════════════════════════════════════
  //  MIERCURI
  // ═══════════════════════════════════════════════════════
  wednesday: [
    {
      time: "08:00 – 10:00",
      subject: "Sisteme de Conducere în Robotică",
      type: "curs",
      room: "K301",
      professor: "D.P.",
      group: "all",
      week: "all"
    },
    {
      time: "10:00 – 12:00",
      subject: "Sisteme de Conducere în Robotică",
      type: "laborator",
      room: "G025",
      professor: "D.P.",
      group: "B",
      week: "odd"
    },
    {
      time: "10:00 – 12:00",
      subject: "Sisteme de Conducere în Robotică",
      type: "laborator",
      room: "G025",
      professor: "D.P.",
      group: "A",
      week: "even"
    },
    {
      time: "12:00 – 14:00",
      subject: "Automate și Microprogramare",
      type: "laborator",
      room: "G022",
      professor: "D.P.",
      group: "B",
      week: "odd"
    },
    {
      time: "12:00 – 14:00",
      subject: "Automate și Microprogramare",
      type: "laborator",
      room: "G022",
      professor: "D.P.",
      group: "A",
      week: "even"
    }
  ],

  // ═══════════════════════════════════════════════════════
  //  JOI
  // ═══════════════════════════════════════════════════════
  thursday: [
    {
      time: "08:00 – 11:00",
      subject: "Rețele de Calculatoare",
      type: "curs",
      room: "G025",
      professor: "M.N.",
      group: "all",
      week: "all"
    },
    {
      time: "11:00 – 12:00",
      subject: "Rețele de Calculatoare",
      type: "seminar",
      room: "G025",
      professor: "M.N.",
      group: "all",
      week: "all"
    },
    {
      time: "14:00 – 16:00",
      subject: "Rețele de Calculatoare",
      type: "laborator",
      room: "G025",
      professor: "M.N.",
      group: "A",
      week: "all"
    },
    {
      time: "16:00 – 18:00",
      subject: "Rețele de Calculatoare",
      type: "laborator",
      room: "G025",
      professor: "M.N.",
      group: "B",
      week: "all"
    },
    {
      time: "18:00 – 20:00",
      subject: "Microcontrolere, Microprocesoare",
      type: "laborator",
      room: "I003",
      professor: "S.C.",
      group: "A",
      week: "odd"
    },
    {
      time: "18:00 – 20:00",
      subject: "Microcontrolere, Microprocesoare",
      type: "laborator",
      room: "I003",
      professor: "I.R.",
      group: "B",
      week: "even"
    }
  ],

  // ═══════════════════════════════════════════════════════
  //  VINERI
  // ═══════════════════════════════════════════════════════
  friday: [
    {
      time: "10:00 – 12:00",
      subject: "Senzori și Sisteme Senzoriale",
      type: "curs",
      room: "K301",
      professor: "D.F.",
      group: "all",
      week: "all"
    },
    {
      time: "12:00 – 14:00",
      subject: "Senzori și Sisteme Senzoriale",
      type: "seminar",
      room: "G116",
      professor: "D.F.",
      group: "all",
      week: "odd"
    },
    {
      time: "12:00 – 14:00",
      subject: "Automate și Microprogramare",
      type: "seminar",
      room: "G022",
      professor: "H.R.",
      group: "B",
      week: "even"
    },
    {
      time: "14:00 – 16:00",
      subject: "Automate și Microprogramare",
      type: "seminar",
      room: "G022",
      professor: "H.R.",
      group: "A",
      week: "even"
    }
  ]
};
