<?php
  $baseDIR = $_GET["BASE_DIR"];
  $imageName = $_GET["IMAGE_NAME"];
?>

<div id="title"><?php echo $imageName;?></div>
<p>
  <table cellspacing="0" cellpadding="0">
    <tr>
      <td width='30'>
        <img src="<?php echo $baseDIR;?>/images/<?php echo $imageName;?>" border="0" alt="<?php echo $imageName;?>">
      </td>
    </tr>
  </table>
</p>


