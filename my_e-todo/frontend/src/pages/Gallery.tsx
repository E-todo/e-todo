import Profile from '../components/Profile'

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>

      <Profile
        name="Katherine Johnson"
        image="https://i.imgur.com/MK3eW3Am.jpg"
      />

      <Profile
        name="Ada Lovelace"
        image="https://i.imgur.com/Sd1AgUOm.jpg"
      />

      <Profile
        name="Marie Curie"
        image="https://i.imgur.com/8RKXAIV.jpg"
      />
    </section>
  )
}