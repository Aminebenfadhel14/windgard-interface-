import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { CheatSheetResult } from '@/lib/schemas';

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#1A1A2E' },
  header: { fontSize: 16, marginBottom: 2, fontFamily: 'Helvetica-Bold' },
  meta: { fontSize: 9, color: '#6B6B8D', marginBottom: 14 },
  section: { marginBottom: 12 },
  sTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 5 },
  red: { color: '#E05252' }, green: { color: '#0AA07E' }, purple: { color: '#6C63FF' }, yellow: { color: '#B8860B' },
  item: { marginBottom: 4, lineHeight: 1.4 },
  bold: { fontFamily: 'Helvetica-Bold' },
  kw: { fontSize: 9, color: '#444' },
});

export function CheatSheetDoc({ data }: { data: CheatSheetResult }) {
  return (
    <Document title="Interview Cheat Sheet — The Pivot">
      <Page size="A4" style={s.page}>
        <Text style={s.header}>YOUR INTERVIEW CHEAT SHEET</Text>
        <Text style={s.meta}>COMPANY: {data.company_name}  ·  ROLE: {data.job_title}  ·  Made with The Pivot</Text>

        <View style={s.section}>
          <Text style={[s.sTitle, s.red]}>3 QUESTIONS THEY'LL ASK (AND HOW TO ANSWER)</Text>
          {data.questions_theyll_ask.map((q, i) => (
            <Text key={i} style={s.item}><Text style={s.bold}>{i + 1}. {q.question}</Text> — {q.how_to_answer}</Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={[s.sTitle, s.green]}>3 STORIES TO TELL (STAR FORMAT)</Text>
          {data.star_stories.map((st, i) => (
            <Text key={i} style={s.item}><Text style={s.bold}>{i + 1}. {st.title}</Text> — {st.summary}</Text>
          ))}
        </View>

        <View style={s.section}>
          <Text style={[s.sTitle, s.purple]}>YOUR PERFECT INTRODUCTION (30s)</Text>
          <Text style={s.item}>"{data.perfect_introduction}"</Text>
        </View>

        <View style={s.section}>
          <Text style={[s.sTitle, s.yellow]}>5 KEYWORDS TO DROP</Text>
          <Text style={s.kw}>{data.keywords.join('   ·   ')}</Text>
        </View>

        <View style={s.section}>
          <Text style={[s.sTitle, s.purple]}>3 QUESTIONS TO ASK THEM</Text>
          {data.questions_to_ask.map((q, i) => (
            <Text key={i} style={s.item}>{i + 1}. "{q}"</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function renderCheatSheetPdf(data: CheatSheetResult): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(<CheatSheetDoc data={data} />));
}
