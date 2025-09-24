import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator as CalculatorIcon } from "lucide-react";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForNext) {
      setDisplay(digit);
      setWaitingForNext(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForNext) {
      setDisplay("0.");
      setWaitingForNext(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNext(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNext(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case "+":
        return firstValue + secondValue;
      case "-":
        return firstValue - secondValue;
      case "×":
        return firstValue * secondValue;
      case "÷":
        return firstValue / secondValue;
      case "=":
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    if (operation && previousValue !== null) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operation);
      
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNext(true);
    }
  };

  const toggleSign = () => {
    if (display !== "0") {
      setDisplay(display.charAt(0) === "-" ? display.slice(1) : "-" + display);
    }
  };

  const percentage = () => {
    const value = parseFloat(display) / 100;
    setDisplay(String(value));
  };

  return (
    <Card data-testid="calculator">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <CalculatorIcon className="h-4 w-4 mr-2" />
          Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input
            type="text"
            value={display}
            readOnly
            className="text-right text-lg font-mono"
            data-testid="calculator-display"
          />
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-sm">
          <Button
            variant="destructive"
            className="p-2"
            onClick={clear}
            data-testid="calc-clear"
          >
            C
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={toggleSign}
            data-testid="calc-sign"
          >
            ±
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={percentage}
            data-testid="calc-percentage"
          >
            %
          </Button>
          <Button
            className="p-2 bg-secondary hover:bg-secondary/90"
            onClick={() => performOperation("÷")}
            data-testid="calc-divide"
          >
            ÷
          </Button>

          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("7")}
            data-testid="calc-7"
          >
            7
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("8")}
            data-testid="calc-8"
          >
            8
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("9")}
            data-testid="calc-9"
          >
            9
          </Button>
          <Button
            className="p-2 bg-secondary hover:bg-secondary/90"
            onClick={() => performOperation("×")}
            data-testid="calc-multiply"
          >
            ×
          </Button>

          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("4")}
            data-testid="calc-4"
          >
            4
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("5")}
            data-testid="calc-5"
          >
            5
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("6")}
            data-testid="calc-6"
          >
            6
          </Button>
          <Button
            className="p-2 bg-secondary hover:bg-secondary/90"
            onClick={() => performOperation("-")}
            data-testid="calc-subtract"
          >
            -
          </Button>

          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("1")}
            data-testid="calc-1"
          >
            1
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("2")}
            data-testid="calc-2"
          >
            2
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={() => inputDigit("3")}
            data-testid="calc-3"
          >
            3
          </Button>
          <Button
            className="p-2 bg-secondary hover:bg-secondary/90"
            onClick={() => performOperation("+")}
            data-testid="calc-add"
          >
            +
          </Button>

          <Button
            variant="outline"
            className="p-2 col-span-2"
            onClick={() => inputDigit("0")}
            data-testid="calc-0"
          >
            0
          </Button>
          <Button
            variant="outline"
            className="p-2"
            onClick={inputDecimal}
            data-testid="calc-decimal"
          >
            .
          </Button>
          <Button
            className="p-2 bg-accent hover:bg-accent/90"
            onClick={handleEquals}
            data-testid="calc-equals"
          >
            =
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
