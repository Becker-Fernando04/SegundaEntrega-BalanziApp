export function estaDentroDelUltimoAno(fecha: string, referencia: Date): boolean {
  const texto = (fecha || '').trim();
  const textoNormalizado = texto.toLowerCase();
  const fechaMovimiento = new Date(referencia);

  if (textoNormalizado.includes('ayer')) {
    fechaMovimiento.setDate(fechaMovimiento.getDate() - 1);
  } else if (!textoNormalizado.includes('hoy') && texto) {
    const iso = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    const latino = texto.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (iso) {
      fechaMovimiento.setFullYear(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    } else if (latino) {
      fechaMovimiento.setFullYear(Number(latino[3]), Number(latino[2]) - 1, Number(latino[1]));
    } else {
      const meses: Record<string, number> = {
        enero: 0, ene: 0, january: 0, jan: 0,
        febrero: 1, feb: 1, february: 1,
        marzo: 2, mar: 2, march: 2,
        abril: 3, abr: 3, april: 3, apr: 3,
        mayo: 4, may: 4,
        junio: 5, jun: 5, june: 5,
        julio: 6, jul: 6, july: 6,
        agosto: 7, ago: 7, august: 7, aug: 7,
        septiembre: 8, sept: 8, sep: 8, september: 8,
        octubre: 9, oct: 9, october: 9,
        noviembre: 10, nov: 10, november: 10,
        diciembre: 11, dic: 11, december: 11, dec: 11
      };
      const mes = textoNormalizado.match(/\b(enero|ene|january|jan|febrero|february|feb|marzo|march|mar|abril|april|abr|apr|mayo|may|junio|june|jun|julio|july|jul|agosto|august|ago|aug|septiembre|september|sept|sep|octubre|october|oct|noviembre|november|nov|diciembre|december|dic|dec)\b/);
      if (mes) {
        const dia = Number(texto.match(/^\s*(\d{1,2})/)?.[1] || 1);
        const anio = Number(texto.match(/\b\d{4}\b/)?.[0] || referencia.getFullYear());
        fechaMovimiento.setFullYear(anio, meses[mes[0]], dia);
      } else {
        const parsed = Date.parse(texto);
        if (!Number.isNaN(parsed)) {
          fechaMovimiento.setTime(parsed);
        }
      }
    }
  }

  const limite = new Date(referencia);
  limite.setFullYear(limite.getFullYear() - 1);
  limite.setHours(0, 0, 0, 0);
  fechaMovimiento.setHours(12, 0, 0, 0);
  return fechaMovimiento >= limite;
}
