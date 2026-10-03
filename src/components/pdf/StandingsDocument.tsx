import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  subtitle: { fontSize: 12, marginBottom: 16, color: '#444' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 4 },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  rank: { width: 32 },
  name: { flex: 1.5 },
  rating: { width: 50, textAlign: 'center' },
  score: { width: 50, textAlign: 'center' },
  tb: { width: 55, textAlign: 'center' },
});

export interface StandingsRow {
  rank: number;
  name: string;
  rating: number | null;
  score: number;
  buchholzCut1: number;
  sonnebornBerger: number;
  directEncounter: number;
  wins: number;
  blackGames: number;
}

export function StandingsDocument(props: { tournamentName: string; rows: StandingsRow[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{props.tournamentName}</Text>
        <Text style={styles.subtitle}>Final Standings</Text>
        <View style={styles.headerRow}>
          <Text style={styles.rank}>#</Text>
          <Text style={styles.name}>Name</Text>
          <Text style={styles.rating}>Rtg</Text>
          <Text style={styles.score}>Pts</Text>
          <Text style={styles.tb}>Bu-1</Text>
          <Text style={styles.tb}>SB</Text>
          <Text style={styles.tb}>DE</Text>
          <Text style={styles.tb}>Wins</Text>
          <Text style={styles.tb}>Blk</Text>
        </View>
        {props.rows.map((row) => (
          <View style={styles.row} key={row.name + row.rank}>
            <Text style={styles.rank}>{row.rank}</Text>
            <Text style={styles.name}>{row.name}</Text>
            <Text style={styles.rating}>{row.rating ?? '—'}</Text>
            <Text style={styles.score}>{row.score}</Text>
            <Text style={styles.tb}>{row.buchholzCut1}</Text>
            <Text style={styles.tb}>{row.sonnebornBerger}</Text>
            <Text style={styles.tb}>{row.directEncounter}</Text>
            <Text style={styles.tb}>{row.wins}</Text>
            <Text style={styles.tb}>{row.blackGames}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
