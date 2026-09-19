local pagebreak = pandoc.RawBlock('openxml', '<w:p><w:r><w:br w:type="page"/></w:r></w:p>')

function Header(element)
  if element.level == 2 then
    return { pagebreak, element }
  end
end
