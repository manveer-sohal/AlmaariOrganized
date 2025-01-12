import Image from "next/image";

/*
this is a prop

the components works like, when this component is called, it needs to also
be passed in variables like a function, name, colour, type, imageSrc

then what it does is useses those variables to load up the "card" 

this is called in the main page layout, and only when the user is authenticated



*/
type ClothingItemProps = {
  colour: string[];
  type: string;
  imageSrc: string;
};

export default function ClothesCard({ imageSrc }: ClothingItemProps) {
  return (
    <div className="border border-indigo-300 m-2 p-2 bg-slate-100 rounded-md w-[200px] h-[200px] shadow-lg relative overflow-hidden cursor-pointer transition-transform ease-in-out duration-300 hover:scale-105 hover:shadow-2xl">
      <Image
        src={imageSrc}
        alt="image"
        width={200}
        height={200}
        className="object-contain w-full h-full absolute inset-0"
      />
    </div>
  );
}
