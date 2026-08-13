import { useStyles } from '../hooks/useStyles';
import { useBodyClass } from '../hooks/useBodyClass';

const EVENTOS = [
  {
    fecha: '📅 18 septiembre 2024',
    titulo: 'SENA en la Feria Internacional de Café, Cacao y Agroturismo',
    descripcion:
      'El evento mostró lo mejor de la caficultura y cacaocultura regional, con participación de aprendices e instructores de las regionales Huila, Antioquia, Caldas, Cauca y Quindío.',
    imagen:
      'https://www.sena.edu.co/es-co/Noticias/PublishingImages/Neiva1-18924.jpeg',
  },
  {
    fecha: '📅 18 agosto 2024',
    titulo: '13.ª Feria y Concurso de Cafés Especiales — Cauca',
    descripcion:
      'Gracias a la alianza entre Tecnicafe, Comité de Cafeteros Cauca y Mercy Corps Colombia, el SENA participa con instructores como jueces y aprendices competidores en Arte Latte, AeroPress y April Brewers Cup.',
    imagen:
      'https://scontent.fclo9-1.fna.fbcdn.net/v/t39.30808-6/486831955_1089983839837796_974248402690324158_n.jpg?stp=dst-jpg_s590x590_tt6&_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_ohc=4R_6S1E_2EQQ7kNvwHngXKF&_nc_oc=Adkryi-Lw3-K_DHDfttBcq5uObtzh1CqFs76yzBh00CaCB_hirwVR0k6o7i8M2Gfoc8&_nc_zt=23&_nc_ht=scontent.fclo9-1.fna&_nc_gid=RLBCsDOxjYZNdAB_XOFkFA&oh=00_AfjOy_0gjIKznv2EFkI_b60igs7F8hwvrzRU-6Q5b2tnZA&oe=6911EDC5',
  },
];

function Eventos() {
  useStyles(['style.css']);
  useBodyClass('eventos-page');

  return (
    <section className="featured eventos-section" style={{ paddingTop: '120px' }}>
      <div className="section-header">
        <span className="section-tag">Eventos</span>
        <h2>Próximos Eventos</h2>
        <p>Participamos en las ferias y concursos de café más importantes de Colombia.</p>
      </div>

      <div className="eventos-grid">
        {EVENTOS.map((evento) => (
          <article className="event-card" key={evento.titulo}>
            <img className="event-card-image" src={evento.imagen} alt={evento.titulo} loading="lazy" />
            <div className="event-card-body">
              <span className="event-date">{evento.fecha}</span>
              <h3>{evento.titulo}</h3>
              <p>{evento.descripcion}</p>
              <a href="#" className="btn-primary">
                Más información
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Eventos;
