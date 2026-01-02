import { useState } from "react"
import Stepper, { Step } from "./ui/stepper"

export default function Onboarding() {
  const [name, setName] = useState("")

  return (
    <Stepper initialStep={2}>
      <Step>
        <p>Custom step content!</p>
      </Step>

      <Step>
        <h2>How about an input?</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name?"
        />
      </Step>

      <Step>
        <h2>Final Step</h2>
        <p>You made it!</p>
      </Step>
    </Stepper>
  )
}
