import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { t } from '@/lib/i18n';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  title: { fontSize: 16, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 12, marginBottom: 16, color: '#444' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 4 },
  headerRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#000', paddingBottom: 4, fontFamily: 'Helvetica-Bold' },
  board: { width: 50 },
  white: { flex: 1 },
  result: { width: 60, textAlign: 'center' },
  black: { flex: 1 },
});

export interface PairingSheetRow {
  board: number;
  white: string;
  black: string | null;
  result: string;
}

export function PairingSheetDocument(props: { tournamentName: string; roundNumber: number; rows: PairingSheetRow[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{props.tournamentName}</Text>
        <Text style={styles.subtitle}>{t('pdf.pairingSheet.subtitle', { number: props.roundNumber })}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.board}>{t('rounds.table.board')}</Text>
          <Text style={styles.white}>{t('rounds.table.white')}</Text>
          <Text style={styles.result}>{t('rounds.table.result')}</Text>
          <Text style={styles.black}>{t('rounds.table.black')}</Text>
        </View>
        {props.rows.map((row) => (
          <View style={styles.row} key={row.board}>
            <Text style={styles.board}>{row.board}</Text>
            <Text style={styles.white}>{row.white}</Text>
            <Text style={styles.result}>{row.result}</Text>
            <Text style={styles.black}>{row.black ?? t('pdf.pairingSheet.byeDash')}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
