type ProfileProps = {
  name: string
  image: string
}

export default function Profile({ name, image }: ProfileProps) {
  return (
    <div>
      <img src={image} alt={name} width={100} />
      <h2>{name}</h2>
    </div>
  )
}