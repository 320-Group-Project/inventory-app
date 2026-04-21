export function BigButton({Title, Color = "#222222"}: {Title: string, Color?: string}){
    return (
        <button type="button" className="btn btn-secondary text-base-100 text-xl px-8 rounded-xl font-normal h-14" style={{backgroundColor: Color}}>
            {Title}
        </button>
    )
}